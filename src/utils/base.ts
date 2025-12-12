export const cn = (...classes: string[]) => {
  return classes.filter(Boolean).join(' ');
}

export const getUniqueId = () => {
  return crypto.randomUUID();
}