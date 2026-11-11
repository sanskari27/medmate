import { Heading } from "@/components/ui/Heading";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import type { FieldSection } from "../../ownerModel";

export function FieldSections({ sections }: { sections: FieldSection[] }) {
  return (
    <Stack className="gap-4">
      {sections.map((section) => (
        <section key={section.title} className="rounded-lg border border-line bg-paper px-4 py-4">
          <Heading level={3} className="text-[15px]">
            {section.title}
          </Heading>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            {section.rows.map((row) => (
              <div key={row.label} className="min-w-0">
                <dt>
                  <Text as="span" variant="label">
                    {row.label}
                  </Text>
                </dt>
                <dd className="mt-0.5">
                  {row.dateTime ? (
                    <time dateTime={row.dateTime} className="text-[13.5px] text-ink">
                      {row.value}
                    </time>
                  ) : (
                    <Text className="text-[13.5px] break-words">{row.value}</Text>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </Stack>
  );
}
