// Student lists are shown in student ID order (ascending). Students without an ID
// go last, ordered by name.

type Named = { student_id?: string; first_name?: string; last_name?: string } | undefined | null;

const collator = new Intl.Collator('th', { numeric: true, sensitivity: 'base' });

export const compareStudents = (a: Named, b: Named): number => {
  const ia = (a?.student_id || '').trim();
  const ib = (b?.student_id || '').trim();
  if (ia && !ib) return -1;
  if (!ia && ib) return 1;
  return collator.compare(ia, ib)
    || collator.compare(`${a?.first_name || ''} ${a?.last_name || ''}`, `${b?.first_name || ''} ${b?.last_name || ''}`);
};
