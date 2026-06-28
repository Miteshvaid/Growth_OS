export function requestNotificationPermission() {
  if (!("Notification" in window)) return;

  Notification.requestPermission().then((permission) => {
    if (permission === "granted") {
      console.log("Notification permission granted");
    }
  });
}

export function sendNotification(title, body) {
  if (!("Notification" in window) || Notification.permission !== "granted")
    return;

  new Notification(title, {
    body,
    icon: "/favicon.ico",
  });
}

export function startReminderCheck(checkFn) {
  // Check immediately
  const check = async () => {
    try {
      const pending = await checkFn();
      if (pending.length > 0) {
        sendNotification(
          "⏰ Task Reminder",
          `You have ${pending.length} pending task(s). Complete to keep your streak!`,
        );
      }
    } catch (err) {
      console.error("Reminder check failed:", err);
    }
  };

  check(); // Immediate check
  const interval = setInterval(check, 5 * 60 * 1000); // Every 5 minutes

  return () => clearInterval(interval);
}
