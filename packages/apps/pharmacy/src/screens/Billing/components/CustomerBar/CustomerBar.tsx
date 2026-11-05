import type { ChangeEvent } from "react";
import { Box } from "@/components/atoms/Box";
import { Input } from "@/components/atoms/Input";
import { Text } from "@/components/atoms/Text";
import { IconAlert, IconCheck, IconUser } from "@/components/atoms/Icon";
import { cn } from "@/utils/className";
import type { CustomerBarProps } from "./CustomerBar.types";

export function CustomerBar({
  customer,
  hasPrescriptionItem,
  prescriptionReady,
  onName,
  onPhone,
  onDoctor,
}: CustomerBarProps) {
  function changeName(event: ChangeEvent<HTMLInputElement>) {
    onName(event.target.value);
  }
  function changePhone(event: ChangeEvent<HTMLInputElement>) {
    onPhone(event.target.value);
  }
  function changeDoctor(event: ChangeEvent<HTMLInputElement>) {
    onDoctor(event.target.value);
  }

  return (
    <Box className="border-b border-line px-4 py-[11px]">
      <Text
        as="span"
        className="mb-2 flex items-center gap-[5px] text-[10px] font-extrabold tracking-[0.07em] text-faint uppercase"
      >
        <IconUser size={12} /> Customer
      </Text>
      <Box className="grid grid-cols-2 gap-[9px]">
        <Input
          data-field="name"
          placeholder="Name (walk-in)"
          value={customer.name}
          onChange={changeName}
        />
        <Input
          data-field="phone"
          placeholder="Phone"
          value={customer.phone}
          onChange={changePhone}
          inputMode="tel"
        />
      </Box>
      {hasPrescriptionItem ? (
        <>
          <Input
            data-field="doctor"
            className={cn("mt-2", !prescriptionReady && "border-rose shadow-[0_0_0_2px_#dc26261a]")}
            placeholder="Prescribing doctor (required for Rx items)"
            value={customer.doctor}
            onChange={changeDoctor}
          />
          <Text
            as="span"
            className={cn(
              "mt-1.5 flex items-center gap-[5px] text-[11px] font-semibold",
              prescriptionReady ? "text-green" : "text-rose",
            )}
          >
            {prescriptionReady ? (
              <>
                <IconCheck size={12} /> Rx doctor recorded
              </>
            ) : (
              <>
                <IconAlert size={12} /> This bill has Rx-only medicine — enter the doctor
              </>
            )}
          </Text>
        </>
      ) : null}
    </Box>
  );
}
