function updateTime() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const gmt8 = new Date(utc + 8 * 3600000);
  const fmt = (n) => String(n).padStart(2, "0");
  document.getElementById("myTime").textContent =
    "My time: " + fmt(gmt8.getHours()) + ":" + fmt(gmt8.getMinutes()) + ":" + fmt(gmt8.getSeconds());
  document.getElementById("yourTime").textContent =
    "Your time: " + fmt(now.getHours()) + ":" + fmt(now.getMinutes()) + ":" + fmt(now.getSeconds());
}
setInterval(updateTime, 1000); 
updateTime();