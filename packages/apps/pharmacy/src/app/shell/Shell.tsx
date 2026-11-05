import { Frame } from "./Frame";
import { PharmaProvider } from "@/app/session/pharmacy-provider";

export default function Shell() {
  return (
    <PharmaProvider>
      <Frame />
    </PharmaProvider>
  );
}
