import { useLocation, useNavigate, useSearchParams as useRouterSearchParams } from "react-router-dom";

export function usePathname() {
  return useLocation().pathname;
}

export function useSearchParams() {
  const [params] = useRouterSearchParams();
  return params;
}

export function useRouter() {
  const navigate = useNavigate();
  return {
    replace(url: string, _options?: { scroll?: boolean }) {
      navigate(url, { replace: true });
    },
  };
}
