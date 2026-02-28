const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatTimestamp(iso: string): string {
  try {
    return dateFormatter.format(new Date(iso));
  } catch {
    return iso;
  }
}

const relativeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

export function timeAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return relativeFormatter.format(-seconds, "second");
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return relativeFormatter.format(-minutes, "minute");
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return relativeFormatter.format(-hours, "hour");
    const days = Math.floor(hours / 24);
    return relativeFormatter.format(-days, "day");
  } catch {
    return iso;
  }
}
