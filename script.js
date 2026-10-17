// Evaton Lifestyle - Separaka sample site

// ---------- Data ----------
// Dates are "YYYY-MM-DD". Past events hide themselves automatically.
const EVENTS = [
    { date: "2026-10-10", title: "Heritage Braai Day", detail: "Braai stands, music, family fun" },
    { date: "2026-10-24", title: "Saturday Pool Party", detail: "DJ by the pool from 12:00" },
    { date: "2026-10-31", title: "Family Fun Day", detail: "Jumping castle, face painting, braai" },
    { date: "2026-11-14", title: "Soulful Pool Session", detail: "Chilled music, pool and braai" },
    { date: "2026-12-16", title: "Reconciliation Day Picnic", detail: "Bring the family, we bring the shade" },
    { date: "2026-12-26", title: "Boxing Day Pool Party", detail: "Festive season kick-off" },
];

const ENTRY = [
    { item: "Day entry (adults)", amount: 50 },
    { item: "Day entry (children under 12)", amount: 30 },
    { item: "Pool access", amount: 30 },
    { item: "Braai stand (per day)", amount: 100 },
    { item: "Tent + 10 chairs (per day)", amount: 350 },
];

// DEMO: messages go to Separaka's number while this is a sample.
// Switch to the owner's number (27662047846) ONLY after he approves the site.
const WHATSAPP_NUMBER = "27732239762";
const BUSINESS_NAME = "Evaton Lifestyle";
const MAX_GROUP = 200;
const MAX_DAYS_AHEAD = 365;
const DAY_MS = 24 * 60 * 60 * 1000;

// ---------- Date helpers ----------
// new Date("2026-10-24") is read as UTC midnight, which can land on the
// previous day in some time zones. Building it from parts keeps it LOCAL.
function parseLocalDate(text) {
    const [year, month, day] = text.split("-").map(Number);
    return new Date(year, month - 1, day);
}

// Strip the clock time so "today" compares as a whole day.
function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Math.round absorbs the 1-hour jump on daylight-saving days (not SA, but safe).
function daysBetween(from, to) {
    return Math.round((startOfDay(to) - startOfDay(from)) / DAY_MS);
}

function formatLong(date) {
    return date.toLocaleDateString("en-ZA", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
}

// "YYYY-MM-DD" for <input type="date"> min/max, in LOCAL time.
function toInputValue(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

// ---------- Events ----------
function upcomingEvents(events, today) {
    return events
        .map(e => ({ ...e, when: parseLocalDate(e.date) }))
        .filter(e => daysBetween(today, e.when) >= 0)
        .sort((a, b) => a.when - b.when);
}

function describeCountdown(days) {
    if (days === 0) return "Today!";
    if (days === 1) return "Tomorrow";
    return `In ${days} days`;
}

function showUpcomingEvents(today) {
    const list = document.getElementById("events-list");
    const nextBox = document.getElementById("next-event");
    const upcoming = upcomingEvents(EVENTS, today);

    list.innerHTML = "";

    if (upcoming.length === 0) {
        nextBox.textContent = "New events coming soon. Follow us on Facebook for dates.";
        const li = document.createElement("li");
        li.textContent = "No events scheduled yet. Check back soon!";
        list.appendChild(li);
        return;
    }

    const next = upcoming[0];
    const days = daysBetween(today, next.when);
    nextBox.textContent = `Next event: ${next.title}, ${formatLong(next.when)} (${describeCountdown(days)})`;

    upcoming.forEach((event, index) => {
        const li = document.createElement("li");
        if (index === 0) li.classList.add("is-next");

        const badge = document.createElement("div");
        badge.className = "event-date";
        const month = event.when.toLocaleDateString("en-ZA", { month: "short" });
        badge.innerHTML = `${event.when.getDate()}<small>${month}</small>`;

        const text = document.createElement("div");
        const title = document.createElement("div");
        title.className = "event-title";
        title.textContent = event.title;
        const detail = document.createElement("div");
        detail.className = "event-detail";
        detail.textContent = `${event.detail} · ${describeCountdown(daysBetween(today, event.when))}`;
        text.append(title, detail);

        li.append(badge, text);
        list.appendChild(li);
    });
}

// ---------- Entry prices ----------
const rand = new Intl.NumberFormat("en-ZA", {
    style: "currency", currency: "ZAR", maximumFractionDigits: 0,
});

function buildEntryTable() {
    const table = document.getElementById("entry-table");
    const headRow = table.createTHead().insertRow();
    for (const title of ["What", "Price"]) {
        const th = document.createElement("th");
        th.textContent = title;
        headRow.appendChild(th);
    }
    const body = table.createTBody();
    for (const row of ENTRY) {
        const tr = body.insertRow();
        tr.insertCell().textContent = row.item;
        tr.insertCell().textContent = rand.format(row.amount);
    }
}

// ---------- Booking form ----------
// Returns an error message (string) or null when everything is fine.
function checkBooking(booking, today) {
    if (booking.name === "") return "Please tell us your name.";
    if (booking.dateText === "") return "Please choose a date.";

    const when = parseLocalDate(booking.dateText);
    const days = daysBetween(today, when);
    if (days < 0) return "That date has already passed. Please choose today or a later date.";
    if (days > MAX_DAYS_AHEAD) return "We take bookings up to one year ahead. Please choose an earlier date.";

    if (booking.sizeText === "") return "Please tell us how many people are coming.";
    const size = Number(booking.sizeText);
    if (!Number.isInteger(size) || size < 1) return "Number of people must be a whole number, 1 or more.";
    if (size > MAX_GROUP) return `For groups bigger than ${MAX_GROUP}, please call us so we can plan properly.`;

    return null;
}

function buildBookingMessage(booking) {
    const when = parseLocalDate(booking.dateText);
    const people = Number(booking.sizeText);
    const word = people === 1 ? "person" : "people";
    return `Hello ${BUSINESS_NAME}, my name is ${booking.name}. ` +
           `I'd like to book ${booking.type} on ${formatLong(when)} for ${people} ${word}. ` +
           `Is it available?`;
}

function setUpBookingForm() {
    const form = document.getElementById("booking-form");
    const errorBox = document.getElementById("book-error");
    const dateInput = document.getElementById("book-date");
    const today = startOfDay(new Date());

    dateInput.min = toInputValue(today);
    dateInput.max = toInputValue(new Date(today.getTime() + MAX_DAYS_AHEAD * DAY_MS));

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const booking = {
            name: document.getElementById("book-name").value.trim(),
            dateText: dateInput.value,
            type: document.getElementById("book-type").value,
            sizeText: document.getElementById("book-size").value.trim(),
        };

        const problem = checkBooking(booking, startOfDay(new Date()));
        if (problem !== null) {
            errorBox.textContent = problem;
            return;
        }

        errorBox.textContent = "";
        const message = buildBookingMessage(booking);
        const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
        window.open(url, "_blank", "noopener");
    });
}

// ---------- Start ----------
showUpcomingEvents(startOfDay(new Date()));
buildEntryTable();
setUpBookingForm();
document.getElementById("year-now").textContent = new Date().getFullYear();
