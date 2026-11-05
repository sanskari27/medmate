export function doctorsInDepartment<T extends { department: string }>(doctors: T[], name: string) {
  return doctors.filter(function match(doctor) {
    return doctor.department === name;
  });
}
