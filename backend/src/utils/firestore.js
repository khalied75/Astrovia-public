export function serializeDocument(snapshot) {
  if (!snapshot.exists) return null;
  return serializeValue({ id: snapshot.id, ...snapshot.data() });
}

function serializeValue(value) {
  if (value?.toDate instanceof Function) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serializeValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serializeValue(item)]));
  }
  return value;
}
