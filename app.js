/**
 * Adam Barber Club - Booking Logic
 * Powered by Firebase Realtime Database for Instant Synchronization
 */

const CONFIG = {
    whatsappNumber: '595994587337',
    staffPassword: 'admin',

    // --- FIREBASE CONFIGURATION ---
    firebaseConfig: {
        apiKey: "AIzaSyCws-6IUCHAwQ8cOIvAecMar_4dKdsTnUE",
        authDomain: "adan-barberclub.firebaseapp.com",
        databaseURL: "https://adan-barberclub-default-rtdb.firebaseio.com",
        projectId: "adan-barberclub",
        storageBucket: "adan-barberclub.firebasestorage.app",
        messagingSenderId: "811006309225",
        appId: "1:811006309225:web:6533ac3f25f8b5d67843f8",
        measurementId: "G-943S8V9Q1B"
    },
    // ----------------------------

    services: [
        { id: 'clásico', name: 'Corte clásico', price: '40.000', duration: 40 },
        { id: 'moderno', name: 'Corte moderno', price: '50.000', duration: 40 },
        { id: 'barba', name: 'Afeitado de barba', price: '35.000', duration: 15 },
        { id: 'corte_barba', name: 'Corte+barba', price: '70.000', duration: 60 },
        { id: 'corte_barba_perfil', name: 'Corte+Barba+Perfilado', price: '80.000', duration: 60 },
        { id: 'full_exp', name: 'Corte+Barba+Perfilado+Exfoliación', price: '90.000', duration: 60 },
        { id: 'cejas', name: 'Perfilado de cejas', price: '10.000', duration: 10 },
        { id: 'exfoliación', name: 'Exfoliación facial', price: '20.000', duration: 10 },
        { id: 'limpieza', name: 'Limpieza capilar', price: '20.000', duration: 15 },
        { id: 'corte_lavado', name: 'Corte + Lavado', price: '70.000', duration: 60 },
        { id: 'depilacion_nasal', name: 'Depilación nasal', price: '15.000', duration: 7 },
        { id: 'depilacion_nasal_oreja', name: 'Depilación nasal + oreja', price: '25.000', duration: 15 },
    ],
    barbers: [
        { id: 'cristhian', name: 'Cristhian Chávez', spec: 'Master Barber - Especialista in Fades', img: 'img/barber-cristhian.jpg' },
        { id: 'diego', name: 'Diego Adan', spec: 'Master Barber - Estilo Clásico & Tijera', img: 'img/barber-diego.jpg' },
        { id: 'ismael', name: 'Ismael Vázquez', spec: 'Master Barber - Especialista in Barba', img: 'img/barber-ismael.jpg' },
    ],
    timeSlots: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
    storageKey: 'adam_barber_bookings_cache',
    socialFeed: {
        instagram: ['img/Instagram image 1 change.jpg', 'img/Instagram imagen 2.jpg'],
        tiktok: ['img/Tiktok image 1.jpg', 'img/Tiktok image 2.jpg']
    }
};

const app = {
    state: {
        step: 1,
        selectedServices: [],
        selectedDate: '',
        selectedTime: '',
        selectedBarber: '',
        customerName: '',
        customerPhone: '',
        viewMonth: new Date().getMonth(),
        viewYear: new Date().getFullYear(),
        bookings: [],
        blocks: [],
        blockViewWeekStart: null,
        blockViewBarber: null,
        db: null
    },

    init() {
        console.log('Adam Barber Club - Firebase Edition Initializing...');

        this.renderServices();
        this.setupDatePicker();
        this.syncMainPageBarbers();
        this.renderSocialFeed();

        this.initFirebase();

        // Initialize block scheduler state
        const now = new Date();
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
        monday.setHours(0, 0, 0, 0);
        this.state.blockViewWeekStart = monday;
        this.state.blockViewBarber = CONFIG.barbers[0].id;
    },

    initFirebase() {
        try {
            firebase.initializeApp(CONFIG.firebaseConfig);
            this.state.db = firebase.database();
            console.log('🔥 Firebase connected successfully');
            this.listenToBookings();
            this.listenToBlocks();
        } catch (e) {
            console.error('Firebase Init Error:', e);
            alert('Error al conectar con la base de datos. Por favor, recarga la página.');
        }
    },

    listenToBookings() {
        const bookingsRef = firebase.database().ref('bookings');

        const cached = localStorage.getItem(CONFIG.storageKey);
        if (cached) {
            try {
                this.state.bookings = JSON.parse(cached);
                this.refreshUIComponents();
            } catch (e) {
                console.warn('Cache corrupted, starting fresh');
                localStorage.removeItem(CONFIG.storageKey);
            }
        }

        bookingsRef.on('value', (snapshot) => {
            const data = snapshot.val();
            const bookingsArray = [];

            if (data) {
                Object.keys(data).forEach(key => {
                    bookingsArray.push({ id: key, ...data[key] });
                });
            }

            this.state.bookings = bookingsArray;
            localStorage.setItem(CONFIG.storageKey, JSON.stringify(bookingsArray));
            this.refreshUIComponents();
            console.log('☁️ Sync: Bookings updated in real-time');
        }, (error) => {
            console.error('Firebase Read Error:', error);
        });
    },

    listenToBlocks() {
        const blocksRef = firebase.database().ref('blocks');

        blocksRef.on('value', (snapshot) => {
            const data = snapshot.val();
            const blocksArray = [];

            if (data) {
                Object.keys(data).forEach(key => {
                    blocksArray.push({ id: key, ...data[key] });
                });
            }

            this.state.blocks = blocksArray;

            const staffView = document.getElementById('staff-agenda-view');
            if (staffView && !staffView.classList.contains('hidden')) {
                this.renderBlockCalendar();
            }

            if (this.state.step === 3) this.renderBarbers();
            if (this.state.step === 4) this.renderTimeSlots();

            console.log('☁️ Sync: Blocks updated in real-time');
        }, (error) => {
            console.error('Firebase Blocks Read Error:', error);
        });
    },

    refreshUIComponents() {
        if (this.state.step === 3) this.renderBarbers();
        if (this.state.step === 4) this.renderTimeSlots();
        const staffView = document.getElementById('staff-agenda-view');
        if (staffView && !staffView.classList.contains('hidden')) {
            this.renderStaffBookings();
            this.updateCompletedCounter();
            this.updateIncomeReport();
            this.renderBlockCalendar();
        }
    },

    syncMainPageBarbers() {
        const barberCards = document.querySelectorAll('.barber-card');
        CONFIG.barbers.forEach((barber, index) => {
            if (barberCards[index]) {
                const nameEl = barberCards[index].querySelector('h3');
                if (nameEl) nameEl.innerText = barber.name;
                const btn = barberCards[index].querySelector('button');
                if (btn) btn.setAttribute('onclick', `app.selectBarberDirect('${barber.id}')`);
            }
        });
    },

    renderSocialFeed() {
        const igContainer = document.getElementById('instagram-feed');
        const tkContainer = document.getElementById('tiktok-feed');
        if (!igContainer || !tkContainer) return;
        igContainer.innerHTML = CONFIG.socialFeed.instagram.map(imgSrc => `
            <div class="group relative overflow-hidden rounded-sm border border-gold/20 bg-charcoal aspect-[9/16] cursor-pointer">
                <img src="${imgSrc}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Instagram Post" loading="lazy">
                <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-obsidian/40">
                    <a href="https://www.instagram.com/adan_barberclub/" target="_blank" class="bg-gold text-obsidian p-3 rounded-full"><i class="fa-brands fa-instagram"></i></a>
                </div>
            </div>
        `).join('');
        tkContainer.innerHTML = CONFIG.socialFeed.tiktok.map(imgSrc => `
            <div class="group relative overflow-hidden rounded-sm border border-gold/20 bg-charcoal aspect-[9/16] cursor-pointer">
                <img src="${imgSrc}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="TikTok Post" loading="lazy">
                <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-obsidian/40">
                    <a href="https://www.tiktok.com/@adanbarberclub?_r=1&_t=ZS-97DKcxu3ouq" target="_blank" class="bg-gold text-obsidian p-3 rounded-full"><i class="fa-brands fa-tiktok"></i></a>
                </div>
            </div>
        `).join('');
    },

    updateStepUI() {
        document.querySelectorAll('.step-content').forEach((el, idx) => {
            el.classList.toggle('active', idx + 1 === this.state.step);
        });
        for (let i = 1; i <= 5; i++) {
            const dot = document.getElementById(`dot-${i}`);
            if (dot) dot.classList.toggle('bg-gold', i === this.state.step);
        }
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        if (prevBtn) {
            prevBtn.classList.toggle('opacity-0', this.state.step === 1);
            prevBtn.classList.toggle('pointer-events-none', this.state.step === 1);
        }
        if (nextBtn) {
            nextBtn.classList.toggle('hidden', this.state.step === 5);
            nextBtn.innerText = this.state.step === 4 ? 'Siguiente' : 'Siguiente';
        }
        if (this.state.step === 3) this.renderBarbers();
        if (this.state.step === 4) this.renderTimeSlots();
        if (this.state.step === 5) this.renderSummary();
    },

    nextStep() {
        if (this.state.step === 1 && this.state.selectedServices.length === 0) return alert('Selecciona un servicio.');
        if (this.state.step === 2 && !this.state.selectedDate) return alert('Selecciona una fecha.');
        if (this.state.step === 3 && !this.state.selectedBarber) return alert('Selecciona un maestro.');
        if (this.state.step === 4 && !this.state.selectedTime) return alert('Selecciona un horario.');
        if (this.state.step < 5) { this.state.step++; this.updateStepUI(); }
    },

    prevStep() {
        if (this.state.step > 1) { this.state.step--; this.updateStepUI(); }
    },

    formatDuration(minutes) {
        if (minutes < 60) return `${minutes} min`;
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return m > 0 ? `${h}h ${m}min` : `${h}h`;
    },

    renderServices() {
        const container = document.getElementById('service-options');
        if (!container) return;
        container.innerHTML = CONFIG.services.map(service => `
            <div onclick="app.toggleService('${service.id}')"
                 class="p-4 bg-obsidian border ${this.state.selectedServices.includes(service.id) ? 'border-gold bg-gold/10' : 'border-gold/30'} cursor-pointer hover:border-gold transition-all flex justify-between items-center group">
                <div class="flex flex-col gap-0">
                    <span class="group-hover:text-gold transition-colors">${service.name}</span>
                    <span class="text-[10px] text-platinum/60">${this.formatDuration(service.duration)}</span>
                </div>
                <span class="text-gold font-bold text-sm">${service.price} Gs</span>
            </div>
        `).join('');
    },

    toggleService(serviceId) {
        const index = this.state.selectedServices.indexOf(serviceId);
        if (index > -1) this.state.selectedServices.splice(index, 1);
        else this.state.selectedServices.push(serviceId);
        this.renderServices();
        // Re-render time slots if on step 3 with new service selection
        if (this.state.step === 3) this.renderBarbers();
        if (this.state.step === 4) this.renderTimeSlots();
    },

    setupDatePicker() { this.renderCalendar(); },

    renderCalendar() {
        const grid = document.getElementById('calendar-grid');
        const monthEl = document.getElementById('calendar-month');
        if (!grid || !monthEl) return;
        const year = this.state.viewYear;
        const month = this.state.viewMonth;
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        monthEl.innerText = `${monthNames[month]} ${year}`;
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysHeader = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
        let html = daysHeader.map(d => `<div class="text-platinum/50 font-bold text-[10px] uppercase">${d}</div>`).join('');
        for (let i = 0; i < firstDay; i++) html += `<div></div>`;
        const today = new Date(); today.setHours(0,0,0,0);
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dateObj = new Date(dateStr + 'T00:00:00');
            const isPast = dateObj < today;
            const isSelected = this.state.selectedDate === dateStr;
            html += `<div onclick="${isPast ? '' : `app.selectDate('${dateStr}')`}"
                     class="p-2 cursor-pointer transition-all border ${isSelected ? 'bg-gold text-obsidian border-gold font-bold' : 'border-gold/10 text-white hover:border-gold'}
                     ${isPast ? 'opacity-20 cursor-not-allowed' : ''}">${day}</div>`;
        }
        grid.innerHTML = html;
    },

    changeMonth(delta) {
        this.state.viewMonth += delta;
        if (this.state.viewMonth > 11) { this.state.viewMonth = 0; this.state.viewYear++; }
        else if (this.state.viewMonth < 0) { this.state.viewMonth = 11; this.state.viewYear--; }
        this.renderCalendar();
    },

    selectDate(date) { this.state.selectedDate = date; this.renderCalendar(); },

    // ===================== DURATION & TIME HELPERS =====================

    timeToMinutes(timeStr) {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    },

    minutesToTime(minutes) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    },

    getTotalDuration(serviceNames) {
        let total = 0;
        if (!serviceNames || serviceNames.length === 0) return 60; // Default 60min as fallback
        serviceNames.forEach(name => {
            const svc = CONFIG.services.find(s => s.name === name);
            if (svc) total += svc.duration;
        });
        return total || 60; // Fallback to 60min if no duration found
    },

    getSelectedDuration() {
        // Get total duration for currently selected services
        const names = this.state.selectedServices.map(id => {
            const svc = CONFIG.services.find(s => s.id === id);
            return svc ? svc.name : '';
        }).filter(Boolean);
        return this.getTotalDuration(names);
    },

    // ===================== END HELPERS =====================

    generateDynamicSlots(barberId) {
        // Combines hourly base slots + exact end times of existing bookings for a specific barber
        const baseSlots = CONFIG.timeSlots;
        const endTimesSet = new Set();

        // Collect end times from active bookings for this barber on the selected date
        const dateBookings = this.state.bookings.filter(b =>
            b.date === this.state.selectedDate && !b.is_deleted && !b.completed
        );
        dateBookings.forEach(b => {
            if (barberId && b.barber_id !== barberId) return;
            const startMin = this.timeToMinutes(b.time);
            const names = b.services || [];
            const duration = this.getTotalDuration(names);
            const endMin = startMin + duration;
            if (endMin < this.timeToMinutes('18:00') && endMin > startMin) {
                endTimesSet.add(this.minutesToTime(endMin));
            }
        });

        // Also add block end times for this barber
        const dateBlocks = this.state.blocks.filter(b => b.date === this.state.selectedDate);
        dateBlocks.forEach(b => {
            if (barberId && b.barber_id !== barberId) return;
            const blockEndMin = this.timeToMinutes(b.time) + 30;
            if (blockEndMin < this.timeToMinutes('18:00')) {
                endTimesSet.add(this.minutesToTime(blockEndMin));
            }
        });

        // Combine + deduplicate + sort
        const allSlots = [...new Set([...baseSlots, ...endTimesSet])].sort();
        return allSlots;
    },

    renderTimeSlots() {
        const container = document.getElementById('time-slots');
        if (!container) return;
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        // Generate slots for the selected barber only
        const barberId = this.state.selectedBarber;
        if (!barberId) {
            container.innerHTML = '<p class="col-span-3 text-center text-platinum/50 italic py-8">Primero selecciona un maestro.</p>';
            return;
        }

        const slots = this.generateDynamicSlots(barberId);
        const barber = CONFIG.barbers.find(b => b.id === barberId);

        container.innerHTML = slots.map(slot => {
            const [slotHour, slotMinute] = slot.split(':').map(Number);
            let isPastSlot = false;
            if (this.state.selectedDate === todayStr && (slotHour < currentHour || (slotHour === currentHour && slotMinute <= currentMinute))) isPastSlot = true;

            const isTaken = this.isSlotTaken(this.state.selectedDate, slot, barberId);
            const isSelected = this.state.selectedTime === slot;
            const isDisabled = isTaken || isPastSlot;

            // Calculate end time for display
            const duration = this.getSelectedDuration();
            const endMin = this.timeToMinutes(slot) + duration;
            const endTime = this.minutesToTime(endMin);

            // Check if end time exceeds 19:00 (closing time)
            const exceedsClosing = endMin > this.timeToMinutes('19:00');

            return `<div onclick="${isDisabled || exceedsClosing ? '' : `app.selectTime('${slot}')`}"
                     class="p-2 text-center border cursor-pointer transition-all flex flex-col justify-center
                     ${isDisabled || exceedsClosing ? 'border-platinum/20 text-platinum/30 cursor-not-allowed opacity-50' : 'border-gold/30 hover:border-gold'}
                     ${isSelected ? 'bg-gold text-obsidian font-bold' : 'text-white'}
                     ${isTaken && !isPastSlot && !exceedsClosing ? 'border-red-500/50 bg-red-900/10' : ''}">
                    <span class="text-sm font-bold">${slot}</span>
                    ${!isDisabled && !isPastSlot && !exceedsClosing ? `<span class="text-[8px] text-platinum/60">→ ${endTime}</span>` : ''}
                    ${isTaken && !isPastSlot && !exceedsClosing ? '<span class="text-[8px] text-red-500 font-bold uppercase">Ocupado</span>' : ''}
                    ${isPastSlot ? '<span class="text-[8px] text-platinum/50 font-bold uppercase">Pasado</span>' : ''}
                    ${exceedsClosing && !isDisabled ? '<span class="text-[8px] text-platinum/50 font-bold uppercase">Cierra 19:00</span>' : ''}
                </div>`;
        }).join('');

        // Show barber name in the title area
        if (barber) {
            const titleEl = document.querySelector('#step-4 h3');
            if (titleEl) titleEl.innerText = `4. Horarios de ${barber.name.split(' ')[0]}`;
        }
    },

    selectTime(slot) { this.state.selectedTime = slot; this.renderTimeSlots(); },

    getBarberAvailableCount(barberId) {
        if (!this.state.selectedDate) return 0;
        const slots = this.generateDynamicSlots(barberId);
        let count = 0;
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        slots.forEach(slot => {
            const [slotHour, slotMinute] = slot.split(':').map(Number);
            let isPastSlot = false;
            if (this.state.selectedDate === todayStr && (slotHour < currentHour || (slotHour === currentHour && slotMinute <= currentMinute))) isPastSlot = true;
            if (!isPastSlot && !this.isSlotTaken(this.state.selectedDate, slot, barberId)) {
                const duration = this.getSelectedDuration();
                const endMin = this.timeToMinutes(slot) + duration;
                if (endMin <= this.timeToMinutes('19:00')) count++;
            }
        });
        return count;
    },

    renderBarbers() {
        const container = document.getElementById('barber-options');
        if (!container) return;
        container.innerHTML = CONFIG.barbers.map(barber => {
            const isSelected = this.state.selectedBarber === barber.id;
            const availableCount = this.getBarberAvailableCount(barber.id);
            const isFull = availableCount === 0 && this.state.selectedDate;
            return `<div onclick="${isFull ? '' : `app.selectBarber('${barber.id}')`}"
                     class="p-4 bg-obsidian border ${isSelected ? 'border-gold bg-gold/10' : 'border-gold/30'} cursor-pointer hover:border-gold transition-all flex items-center gap-4 group ${isFull ? 'opacity-50' : ''}">
                    <img src="${barber.img}" class="w-12 h-12 rounded-full object-cover border border-gold/50" loading="lazy">
                    <div class="flex-grow">
                        <div class="font-bold group-hover:text-gold transition-colors">${barber.name}</div>
                        ${this.state.selectedDate ? `<div class="text-[10px] text-platinum/60">${isFull ? 'Sin horarios disponibles' : `${availableCount} horario${availableCount !== 1 ? 's' : ''} disponible${availableCount !== 1 ? 's' : ''}`}</div>` : ''}
                    </div>
                    ${isFull ? '<span class="text-red-500 text-[10px] font-bold uppercase">Completo</span>' : ''}
                </div>`;
        }).join('');
    },

    selectBarber(id) { this.state.selectedBarber = id; this.renderBarbers(); },

    handleBarberTaken(name) { alert(`Lo sentimos, ${name} ya tiene una cita en este horario.`); },

    selectBarberDirect(id) {
        this.openBooking();
        this.state.selectedBarber = id;
        this.state.step = 1;
        this.updateStepUI();
    },

    isSlotTaken(date, time, barberId) {
        if (!date || !time) return false;

        // Check blocks (exact time match)
        const blockTaken = this.state.blocks.some(b => b.date === date && b.time === time && b.barber_id === barberId);
        if (blockTaken) return true;

        // Calculate the new booking's time range
        const newStartMin = this.timeToMinutes(time);
        const newDuration = this.getSelectedDuration();
        const newEndMin = newStartMin + newDuration;

        // Check if any existing booking overlaps with this time range
        return this.state.bookings.some(b => {
            if (b.is_deleted || b.completed) return false;
            if (b.date !== date || b.barber_id !== barberId) return false;

            const existingStartMin = this.timeToMinutes(b.time);
            const existingServiceNames = b.services || [];
            const existingDuration = this.getTotalDuration(existingServiceNames);
            const existingEndMin = existingStartMin + existingDuration;

            // Overlap: starts before other ends AND ends after other starts
            return newStartMin < existingEndMin && newEndMin > existingStartMin;
        });
    },

    renderSummary() {
        const barber = CONFIG.barbers.find(b => b.id === this.state.selectedBarber);
        const services = this.state.selectedServices.map(id => CONFIG.services.find(s => s.id === id).name).join(', ');
        const totalMin = this.getSelectedDuration();
        document.getElementById('sum-service').innerText = services || 'No seleccionado';
        document.getElementById('sum-barber').innerText = barber ? barber.name : 'No seleccionado';
        document.getElementById('sum-date').innerText = this.state.selectedDate || 'No seleccionada';
        document.getElementById('sum-time').innerText = this.state.selectedTime || 'No seleccionada';
        const durEl = document.getElementById('sum-duration');
        if (durEl) {
            const endMin = this.timeToMinutes(this.state.selectedTime) + totalMin;
            const endTime = this.minutesToTime(endMin);
            durEl.innerText = `${this.formatDuration(totalMin)} (${this.state.selectedTime} - ${endTime})`;
        }
    },

    async confirmBooking() {
        const customerName = document.getElementById('customer-name').value;
        const customerPhone = document.getElementById('customer-phone').value;
        if (!customerName || !customerPhone) return alert('Ingresa nombre y teléfono.');
        const barber = CONFIG.barbers.find(b => b.id === this.state.selectedBarber);
        let totalCost = 0;
        const serviceNames = this.state.selectedServices.map(id => {
            const s = CONFIG.services.find(serv => serv.id === id);
            if (s) { totalCost += parseInt(s.price.replace(/\\./g, '')); return s.name; }
            return 'Desconocido';
        });
        const totalDuration = this.getTotalDuration(serviceNames);
        const endTime = this.minutesToTime(this.timeToMinutes(this.state.selectedTime) + totalDuration);

        const booking = {
            customer_name: customerName,
            customer_phone: customerPhone,
            date: this.state.selectedDate,
            time: this.state.selectedTime,
            end_time: endTime,
            barber_id: this.state.selectedBarber,
            barber_name: barber ? barber.name : 'Desconocido',
            services: serviceNames,
            total_cost: totalCost.toLocaleString('pt-BR') + ' Gs',
            total_duration: totalDuration,
            is_deleted: false,
            completed: false
        };
        if (this.state.db) {
            try {
                await firebase.database().ref('bookings').push(booking);
            } catch (e) {
                console.error('Firebase save error:', e);
                alert('Error al guardar en la nube, se guardó localmente.');
            }
        }
        this.state.bookings.push(booking);
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(this.state.bookings));
        this.sendWhatsApp(booking);
    },

    sendWhatsApp(booking) {
        const servicesText = booking.services.join(', ');
        const dateObj = new Date(booking.date + 'T00:00:00');
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        const formattedDate = `${dateObj.getDate()} de ${monthNames[dateObj.getMonth()]}`;
        const endTime = booking.end_time || this.minutesToTime(this.timeToMinutes(booking.time) + (booking.total_duration || 60));
        const message = `💈 *Cita Solicitada - Adan BarberClub* 💈\n\n👤 **Cliente:** ${booking.customer_name}\n✂️ **Servicios:** ${servicesText}\n💰 **Total:** ${booking.total_cost}\n👨‍🦱 **Barbero:** ${booking.barber_name}\n📅 **Fecha:** ${formattedDate}\n⏰ **Horario:** ${booking.time} - ${endTime}\n\n*Por favor, confirma la disponibilidad de este espacio.*`;
        window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
        this.closeBooking();
    },

    openStaffLogin() {
        document.getElementById('staff-modal').classList.remove('hidden');
        document.getElementById('staff-login-view').classList.remove('hidden');
        document.getElementById('staff-agenda-view').classList.add('hidden');
    },

    async verifyStaff() {
        const pin = document.getElementById('staff-pin').value;
        if (pin === CONFIG.staffPassword) {
            document.getElementById('staff-login-view').classList.add('hidden');
            document.getElementById('staff-agenda-view').classList.remove('hidden');
            this.populateBarberFilter();
            this.renderStaffBookings();
            this.updateCompletedCounter();
            this.updateIncomeReport();
            this.renderBlockCalendar();
        } else alert('PIN incorrecto');
    },

    logoutStaff() {
        document.getElementById('staff-pin').value = '';
        this.closeStaff();
    },

    closeStaff() { document.getElementById('staff-modal').classList.add('hidden'); },

    async markAsCompleted(bookingId) {
        const booking = this.state.bookings.find(b => b.id === bookingId);
        if (!booking) return;
        if (confirm(`¿Cita realizada?`)) {
            const completedAt = Date.now();
            if (this.state.db) {
                try {
                    await firebase.database().ref('bookings/' + booking.id).update({ completed: true, completed_at: completedAt });
                } catch (e) { console.error('Firebase update error:', e); }
            }
            booking.completed = true;
            booking.completed_at = completedAt;
            localStorage.setItem(CONFIG.storageKey, JSON.stringify(this.state.bookings));
            this.renderStaffBookings();
            this.updateCompletedCounter();
            this.updateIncomeReport();
        }
    },

    async handleBookingAction(bookingId) {
        const booking = this.state.bookings.find(b => b.id === bookingId);
        if (!booking) return;
        if (confirm(`¿Eliminar cita de ${booking.customer_name}?`)) {
            if (this.state.db) {
                try {
                    await firebase.database().ref('bookings/' + booking.id).update({ is_deleted: true });
                } catch (e) { console.error('Firebase update error:', e); }
            }
            booking.is_deleted = true;
            localStorage.setItem(CONFIG.storageKey, JSON.stringify(this.state.bookings));
            this.renderStaffBookings();
        }
    },

    populateBarberFilter() {
        const filter = document.getElementById('filter-barber');
        if (!filter) return;
        filter.innerHTML = '<option value="all">Todos los Barberos</option>';
        CONFIG.barbers.forEach(barber => {
            const opt = document.createElement('option');
            opt.value = barber.id;
            opt.textContent = barber.name;
            filter.appendChild(opt);
        });
    },

    updateCompletedCounter() {
        const haircutEl = document.getElementById('haircut-count');
        const otherEl = document.getElementById('other-count');
        if (!haircutEl || !otherEl) return;

        const corteIds = ['clásico', 'moderno', 'corte_barba', 'corte_barba_perfil', 'full_exp', 'corte_lavado'];
        const corteNames = corteIds.map(id => {
            const svc = CONFIG.services.find(s => s.id === id);
            return svc ? svc.name : null;
        }).filter(Boolean);

        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recentBookings = this.state.bookings.filter(b =>
            b.completed === true && b.completed_at && b.completed_at >= sevenDaysAgo
        );

        let haircutCount = 0;
        let otherCount = 0;

        recentBookings.forEach(b => {
            if (!b.services || b.services.length === 0) {
                otherCount++;
                return;
            }
            const hasHaircut = b.services.some(sName => corteNames.includes(sName));
            if (hasHaircut) {
                haircutCount++;
            } else {
                otherCount++;
            }
        });

        haircutEl.textContent = haircutCount;
        otherEl.textContent = otherCount;
    },

    updateIncomeReport() {
        const incomeEl = document.getElementById('weekly-income');
        const barberBreakdownEl = document.getElementById('income-per-barber');
        if (!incomeEl || !barberBreakdownEl) return;

        const now = new Date();
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
        monday.setHours(0, 0, 0, 0);
        const weekStart = monday.getTime();

        const weekBookings = this.state.bookings.filter(b =>
            b.completed === true && b.completed_at && b.completed_at >= weekStart
        );

        let totalIncome = 0;
        const barberIncome = {};
        CONFIG.barbers.forEach(b => { barberIncome[b.id] = 0; });

        weekBookings.forEach(b => {
            let cost = 0;
            if (b.total_cost) {
                const parsed = parseInt(b.total_cost.replace(/\\./g, '').replace(' Gs', ''));
                if (!isNaN(parsed)) cost = parsed;
            } else if (b.services && b.services.length > 0) {
                b.services.forEach(sName => {
                    const svc = CONFIG.services.find(s => s.name === sName);
                    if (svc) cost += parseInt(svc.price.replace(/\\./g, ''));
                });
            }
            totalIncome += cost;
            if (b.barber_id && barberIncome[b.barber_id] !== undefined) {
                barberIncome[b.barber_id] += cost;
            }
        });

        incomeEl.textContent = totalIncome.toLocaleString('pt-BR');

        barberBreakdownEl.innerHTML = CONFIG.barbers.map(b => {
            const income = barberIncome[b.id] || 0;
            return `<div class="border-l border-gold/10 first:border-l-0">
                        <div class="text-[10px] uppercase tracking-wider text-platinum">${b.name.split(' ')[0]}</div>
                        <div class="text-sm font-bold gold-text">${income.toLocaleString('pt-BR')}</div>
                    </div>`;
        }).join('');
    },

    // ===================== BLOCK SCHEDULE METHODS =====================

    generateBlockSlots() {
        // Block calendar uses 30-min intervals for a cleaner view
        const slots = [];
        for (let h = 9; h <= 19; h++) {
            for (let m = 0; m < 60; m += 30) {
                const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                slots.push(time);
            }
        }
        return slots;
    },

    renderBlockCalendar() {
        const weekStart = this.state.blockViewWeekStart;
        const barberId = this.state.blockViewBarber;
        if (!weekStart || !barberId) return;

        const weekLabelEl = document.getElementById('block-week-label');
        if (weekLabelEl) {
            const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
            const sunDate = new Date(weekStart);
            sunDate.setDate(sunDate.getDate() + 6);
            weekLabelEl.textContent = `Semana del ${weekStart.getDate()} ${monthNames[weekStart.getMonth()]}`;
        }

        const tabsEl = document.getElementById('block-barber-tabs');
        if (tabsEl) {
            tabsEl.innerHTML = CONFIG.barbers.map(b => `
                <button onclick="app.selectBlockBarber('${b.id}')"
                        class="px-4 py-2 text-xs uppercase tracking-widest transition-all ${b.id === barberId ? 'bg-gold text-obsidian font-bold' : 'border border-gold/30 text-platinum hover:border-gold'}">
                    ${b.name.split(' ')[0]}
                </button>
            `).join('');
        }

        const calendarEl = document.getElementById('block-calendar');
        if (!calendarEl) return;

        const dayNames = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const blockSlots = this.generateBlockSlots();

        let html = '<div class="overflow-x-auto">';
        html += '<table class="w-full border-collapse">';

        html += '<thead><tr>';
        html += '<th class="bg-obsidian p-2 text-[10px] uppercase tracking-widest text-platinum font-bold border border-gold/10 w-[60px]">Hora</th>';
        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart);
            day.setDate(day.getDate() + i);
            const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;
            html += `<th class="bg-obsidian p-2 text-[10px] uppercase tracking-widest font-bold border border-gold/10 ${isToday ? 'text-gold' : 'text-platinum'}">${dayNames[i]}<br><span class="text-xs">${day.getDate()}</span></th>`;
        }
        html += '</tr></thead>';

        html += '<tbody>';
        blockSlots.forEach(slot => {
            html += '<tr>';
            html += `<td class="bg-obsidian p-2 text-[10px] text-platinum font-mono text-center border border-gold/10">${slot}</td>`;
            for (let i = 0; i < 7; i++) {
                const day = new Date(weekStart);
                day.setDate(day.getDate() + i);
                const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                const isPast = day < today;
                const isBlocked = this.state.blocks.some(b => b.date === dateStr && b.time === slot && b.barber_id === barberId);
                const isToday = dateStr === todayStr;

                const bgClass = isBlocked
                    ? 'bg-red-900/40'
                    : (isToday ? 'bg-gold/5' : 'bg-obsidian');
                const borderClass = isBlocked
                    ? 'border-red-500/50'
                    : 'border-gold/10';

                html += `<td onclick="${isPast ? '' : `app.toggleBlock('${dateStr}','${slot}','${barberId}')`}"
                            class="${bgClass} ${borderClass} border cursor-pointer hover:border-gold transition-all min-h-[32px] h-[32px] text-center ${isPast ? 'opacity-20 cursor-not-allowed' : ''}">
                            ${isBlocked ? '<span class="text-red-400 text-sm font-bold">✕</span>' : (isPast ? '' : '<span class="text-platinum/20 text-xs">+</span>')}
                        </td>`;
            }
            html += '</tr>';
        });
        html += '</tbody></table></div>';

        calendarEl.innerHTML = html;
    },

    selectBlockBarber(barberId) {
        this.state.blockViewBarber = barberId;
        this.renderBlockCalendar();
    },

    changeBlockWeek(delta) {
        const newStart = new Date(this.state.blockViewWeekStart);
        newStart.setDate(newStart.getDate() + delta * 7);
        this.state.blockViewWeekStart = newStart;
        this.renderBlockCalendar();
    },

    async toggleBlock(date, time, barberId) {
        const existingBlock = this.state.blocks.find(b => b.date === date && b.time === time && b.barber_id === barberId);

        if (this.state.db) {
            try {
                if (existingBlock) {
                    await firebase.database().ref('blocks/' + existingBlock.id).remove();
                } else {
                    await firebase.database().ref('blocks').push({
                        date: date,
                        time: time,
                        barber_id: barberId,
                        created_at: Date.now()
                    });
                }
            } catch (e) {
                console.error('Firebase block error:', e);
            }
        }

        if (existingBlock) {
            const idx = this.state.blocks.findIndex(b => b.id === existingBlock.id);
            if (idx > -1) this.state.blocks.splice(idx, 1);
        } else {
            this.state.blocks.push({ id: 'local_' + Date.now(), date, time, barber_id: barberId, created_at: Date.now() });
        }

        this.renderBlockCalendar();

        if (this.state.step === 3) this.renderBarbers();
        if (this.state.step === 4) this.renderTimeSlots();
    },

    confirmBlocks() {
        const btn = document.getElementById('block-save-btn');
        if (btn) {
            btn.textContent = '✓ Guardado';
            btn.classList.remove('border-gold/30', 'text-platinum', 'hover:border-gold', 'hover:text-gold');
            btn.classList.add('border-green-500', 'text-green-400');
            setTimeout(() => {
                btn.textContent = 'Aplicar Cambios';
                btn.classList.remove('border-green-500', 'text-green-400');
                btn.classList.add('border-gold/30', 'text-platinum', 'hover:border-gold', 'hover:text-gold');
            }, 2000);
        }
    },

    // ===================== END BLOCK SCHEDULE METHODS =====================

    renderStaffBookings() {
        const filterBarberId = document.getElementById('filter-barber').value;
        const body = document.getElementById('bookings-body');
        if (!body) return;
        const active = this.state.bookings.filter(b => !b.is_deleted && !b.completed);
        const filtered = filterBarberId === 'all' ? active : active.filter(b => b.barber_id === filterBarberId);
        if (filtered.length === 0) {
            body.innerHTML = '<tr><td colspan="6" class="py-8 text-center opacity-50 italic">No hay citas programadas.</td></tr>';
            return;
        }
        body.innerHTML = filtered.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)).map(b => {
            const endTime = b.end_time || this.minutesToTime(this.timeToMinutes(b.time) + (b.total_duration || 60));
            return `<tr class="border-b border-gold/10 hover:bg-gold/5 transition-colors">
                <td class="py-4 px-4">${b.date}</td>
                <td class="py-4 px-4">${b.time} - ${endTime}</td>
                <td class="py-4 px-4">${b.barber_name}</td>
                <td class="py-4 px-4">${b.services.join(', ')}</td>
                <td class="py-4 px-4">
                    <div class="flex flex-col gap-1">
                        <span class="font-bold text-white">${b.customer_name}</span>
                        <span class="text-[10px] text-platinum">${b.customer_phone}</span>
                    </div>
                </td>
                <td class="py-4 px-4">
                    <div class="flex gap-2">
                        <button onclick="app.markAsCompleted('${b.id}')" class="text-xs uppercase p-1 border border-green-600 text-green-500 hover:bg-green-600 hover:text-white transition-all">Realizado</button>
                        <button onclick="app.handleBookingAction('${b.id}')" class="text-xs uppercase p-1 border border-red-600 text-red-500 hover:bg-red-600 hover:text-white transition-all">Eliminar</button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    },

    openBooking() {
        this.state.selectedServices = []; this.state.selectedDate = ''; this.state.selectedTime = ''; this.state.selectedBarber = '';
        document.getElementById('booking-modal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        this.state.step = 1;
        this.updateStepUI();
    },

    closeBooking() {
        document.getElementById('booking-modal').classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
};

window.openBooking = () => app.openBooking();
window.closeBooking = () => app.closeBooking();
window.changeStep = (delta) => delta > 0 ? app.nextStep() : app.prevStep();
window.openStaffLogin = () => app.openStaffLogin();
window.verifyStaff = () => app.verifyStaff();
window.logoutStaff = () => app.logoutStaff();
window.closeStaff = () => app.closeStaff();
window.selectBarberDirect = (id) => app.selectBarberDirect(id);
window.toggleMobileMenu = () => {
    const menu = document.getElementById('mobile-menu');
    if (menu) menu.classList.toggle('hidden');
};
window.onload = () => app.init();
