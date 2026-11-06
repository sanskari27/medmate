import { faultOf } from "@/utils/validation";

export function faultMessage(error: unknown, fallback: string): string {
  if (typeof error === "string" && error) return error;
  return faultOf(error, fallback).message;
}
