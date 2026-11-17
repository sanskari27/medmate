import { useAppSelector } from "@/app/store/hooks";
import { useState } from "react";
import { OtpStep } from "../../components/OtpStep";
import { PhoneStep } from "../../components/PhoneStep";
import { PinSetup } from "../../components/PinSetup";
import { PinStep } from "../../components/PinStep";

export function LoginPage() {
  const step = useAppSelector((state) => state.auth.step);
  const [phone, setPhone] = useState<string>("");

  switch (step) {
    case "phone":
      return <PhoneStep onPhone={setPhone} />;
    case "otp":
      return <OtpStep phone={phone} />;
    case "pin":
      return <PinStep phone={phone} />;
    case "pin-setup":
      return <PinSetup />;
  }
}
