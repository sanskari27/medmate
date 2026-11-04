locals {
  host_zone = merge([
    for record in var.records : {
      for host in record.hosts : host => record.zone_id
    }
  ]...)
  hosts        = sort(keys(local.host_zone))
  error_page   = var.pretty_html ? "/404.html" : "/index.html"
  error_status = var.pretty_html ? 404 : 200
}

resource "aws_acm_certificate" "site" {
  provider                  = aws.use1
  domain_name               = local.hosts[0]
  subject_alternative_names = length(local.hosts) > 1 ? slice(local.hosts, 1, length(local.hosts)) : null
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "certificate" {
  for_each = {
    for option in aws_acm_certificate.site.domain_validation_options : option.domain_name => {
      name    = option.resource_record_name
      type    = option.resource_record_type
      record  = option.resource_record_value
      zone_id = local.host_zone[option.domain_name]
    }
  }

  allow_overwrite = true
  zone_id         = each.value.zone_id
  name            = each.value.name
  type            = each.value.type
  ttl             = 60
  records         = [each.value.record]
}

resource "aws_acm_certificate_validation" "site" {
  provider                = aws.use1
  certificate_arn         = aws_acm_certificate.site.arn
  validation_record_fqdns = [for record in aws_route53_record.certificate : record.fqdn]
}

resource "aws_cloudfront_function" "pretty" {
  count   = var.pretty_html ? 1 : 0
  name    = "medmate-${var.name}-pretty"
  runtime = "cloudfront-js-2.0"
  publish = true
  code    = <<-EOF
    function handler(event) {
      var request = event.request;
      var uri = request.uri;
      if (uri === "/") {
        request.uri = "/index.html";
        return request;
      }
      var slash = uri.lastIndexOf("/");
      var dot = uri.lastIndexOf(".");
      if (uri.charAt(uri.length - 1) === "/") {
        request.uri += "index.html";
      } else if (dot < slash) {
        request.uri += ".html";
      }
      return request;
    }
  EOF
}

resource "aws_cloudfront_origin_access_control" "site" {
  name                              = "medmate-${var.name}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "medmate ${var.name}"
  aliases             = local.hosts
  price_class         = "PriceClass_200"
  default_root_object = "index.html"
  wait_for_deployment = true

  origin {
    domain_name              = var.bucket_regional_domain_name
    origin_id                = "s3"
    origin_path              = "/${var.static_prefix}"
    origin_access_control_id = aws_cloudfront_origin_access_control.site.id
  }

  default_cache_behavior {
    target_origin_id       = "s3"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    cache_policy_id        = "658327ea-f89d-4fab-a63d-7e88639e58f6"

    dynamic "function_association" {
      for_each = var.pretty_html ? [1] : []
      content {
        event_type   = "viewer-request"
        function_arn = aws_cloudfront_function.pretty[0].arn
      }
    }
  }

  custom_error_response {
    error_code            = 403
    response_code         = local.error_status
    response_page_path    = local.error_page
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 404
    response_code         = local.error_status
    response_page_path    = local.error_page
    error_caching_min_ttl = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.site.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = {
    Name = "medmate-${var.name}"
    App  = var.name
  }
}

resource "aws_route53_record" "site" {
  for_each        = local.host_zone
  allow_overwrite = true
  zone_id         = each.value
  name            = each.key
  type            = "A"

  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_ssm_parameter" "app" {
  for_each = {
    kind            = var.kind
    hosts           = join(",", local.hosts)
    static_prefix   = var.static_prefix
    distribution_id = aws_cloudfront_distribution.site.id
  }

  name  = "/medmate-repo/${var.name}/${each.key}"
  type  = "String"
  value = each.value
}
