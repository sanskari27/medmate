export type AdmitModalProps = {
  preset: {
    wardId: string;
    bed: string;
  } | null;
  onClose: () => void;
  onAdmitted: (id: string) => void;
};
