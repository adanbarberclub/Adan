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
        { id: 'clásico', name: 'Corte clásico', price: '40.000' },
        { id: 'moderno', name: 'Corte moderno', price: '50.000' },
        { id: 'barba', name: 'Afeitado de barba', price: '35.000' },
        { id: 'corte_barba', name: 'Corte+barba', price: '70.000' },
        { id: 'corte_barba_perfil', name: 'Corte+Barba+Perfilado', price: '80.000' },
        { id: 'full_exp', name: 'Corte+Barba+Perfilado+Exfoliación', price: '90.000' },
        { id: 'cejas', name: 'Perfilado de cejas', price: '10.000' },
        { id: 'exfoliación', name: 'Exfoliación facial', price: '20.000' },
        { id: 'limpieza', name: 'Limpieza capilar', price: '20.000' },
    ],
    barbers: [
        { id: 'cristhian', name: 'Cristhian Chávez', spec: 'Master Barber - Especialista in Fades', img: 'img/barber-cristhian.jpg' },
        { id: 'diego', name: 'Diego Adan', spec: 'Master Barber - Estilo Clásico & Tijera', img: 'img/barber-diego.jpg' },
        { id: 'ismael', name: 'Ismael Vázquez', spec: 'Master Barber - Especialista in Barba', img: 'img/barber-ismael.jpg' },
    ],
    timeSlots: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'],
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
        db: null
    },

    init() {
        console.log('Adam Barber Club - Firebase Edition Initializing...');

        this.renderServices();
        this.setupDatePicker();
        this.syncMainPageBarbers();
        this.renderSocialFeed();

        this.initFirebase();
    },

    initFirebase() {
        try {
            firebase.initializeApp(CONFIG.firebaseConfig);
            this.state.db = firebase.database();
            console.log('🔥 Firebase connected successfully');
            this.listenToBookings();
        } catch (e) {
            console.error('Firebase Init Error:', e);
            alert('Error al conectar con la base de datos. Por favor, recarga la página.');
        }
    },

    listenToBookings() {
        const bookingsRef = firebase.database().ref('bookings');

        // Carga inicial desde Cache para evitar lag
        const cached = localStorage.getItem(CONFIG.storageKey);
        if (cached) {
            this.state.bookings = JSON.parse(cached);
            this.refreshUIComponents();
        }

        // Escucha cambios en tiempo real (Sincronización instantánea)
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

    refreshUIComponents() {
        if (this.state.step === 3) this.renderTimeSlots();
        if (this.state.step === 4) this.renderBarbers();
        const staffView = document.getElementById('staff-agenda-view');
        if (staffView && !staffView.classList.contains('hidden')) {
            this.renderStaffBookings();
            this.updateCompletedCounter();
            this.updateIncomeReport();
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
            nextBtn.innerText = this.state.step === 4 ? 'Finalizar' : 'Siguiente';
        }
        if (this.state.step === 3) this.renderTimeSlots();
        if (this.state.step === 4) this.renderBarbers();
        if (this.state.step === 5) this.renderSummary();
    },

    nextStep() {
        if (this.state.step === 1 && this.state.selectedServices.length === 0) return alert('Selecciona un servicio.');
        if (this.state.step === 2 && !this.state.selectedDate) return alert('Selecciona una fecha.');
        if (this.state.step === 3 && !this.state.selectedTime) return alert('Selecciona un horario.');
        if (this.state.step === 4 && !this.state.selectedBarber) return alert('Selecciona un maestro.');
        if (this.state.step < 5) { this.state.step++; this.updateStepUI(); }
    },

    prevStep() {
        if (this.state.step > 1) { this.state.step--; this.updateStepUI(); }
    },

    renderServices() {
        const container = document.getElementById('service-options');
        if (!container) return;
        container.innerHTML = CONFIG.services.map(service => `
            <div onclick="app.toggleService('${service.id}')"
                 class="p-4 bg-obsidian border ${this.state.selectedServices.includes(service.id) ? 'border-gold bg-gold/10' : 'border-gold/30'} cursor-pointer hover:border-gold transition-all flex justify-between items-center group">
                <span class="group-hover:text-gold transition-colors">${service.name}</span>
                <span class="text-gold font-bold">${service.price} Gs</span>
            </div>
        `).join('');
    },

    toggleService(serviceId) {
        const index = this.state.selectedServices.indexOf(serviceId);
        if (index > -1) this.state.selectedServices.splice(index, 1);
        else this.state.selectedServices.push(serviceId);
        this.renderServices();
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

    renderTimeSlots() {
        const container = document.getElementById('time-slots');
        if (!container) return;
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        container.innerHTML = CONFIG.timeSlots.map(slot => {
            const [slotHour, slotMinute] = slot.split(':').map(Number);
            let isPastSlot = false;
            const todayStr = new Date().toISOString().split('T')[0];
            if (this.state.selectedDate === todayStr && (slotHour < currentHour || (slotHour === currentHour && slotMinute <= currentMinute))) isPastSlot = true;
            const isFull = CONFIG.barbers.every(barber => this.isSlotTaken(this.state.selectedDate, slot, barber.id));
            let isSpecificBarberTaken = false;
            if (this.state.selectedBarber) isSpecificBarberTaken = this.isSlotTaken(this.state.selectedDate, slot, this.state.selectedBarber);
            const isSelected = this.state.selectedTime === slot;
            const isDisabled = isFull || isSpecificBarberTaken || isPastSlot;
            return `<div onclick="${isDisabled ? '' : `app.selectTime('${slot}')`}"
                     class="p-2 text-center border cursor-pointer transition-all flex flex-col justify-center
                     ${isDisabled ? 'border-platinum/20 text-platinum/30 cursor-not-allowed opacity-50' : 'border-gold/30 hover:border-gold'}
                     ${isSelected ? 'bg-gold text-obsidian font-bold' : 'text-white'}
                     ${isSpecificBarberTaken && !isFull && !isPastSlot ? 'border-red-500/50 bg-red-900/10' : ''}">
                    <span class="text-sm">${slot}</span>
                    ${isSpecificBarberTaken && !isFull && !isPastSlot ? '<span class="text-[8px] text-red-500 font-bold uppercase">Ocupado</span>' : ''}
                    ${isPastSlot ? '<span class="text-[8px] text-platinum/50 font-bold uppercase">Pasado</span>' : ''}
                </div>`;
        }).join('');
    },

    selectTime(slot) { this.state.selectedTime = slot; this.renderTimeSlots(); },

    renderBarbers() {
        const container = document.getElementById('barber-options');
        if (!container) return;
        container.innerHTML = CONFIG.barbers.map(barber => {
            const isTaken = this.isSlotTaken(this.state.selectedDate, this.state.selectedTime, barber.id);
            const isSelected = this.state.selectedBarber === barber.id;
            return `<div onclick="${isTaken ? `app.handleBarberTaken('${barber.name}')` : `app.selectBarber('${barber.id}')`}"
                     class="p-4 bg-obsidian border ${isSelected ? 'border-gold bg-gold/10' : 'border-gold/30'} cursor-pointer hover:border-gold transition-all flex items-center gap-4 group ${isTaken ? 'opacity-60' : ''}">
                    <img src="${barber.img}" class="w-12 h-12 rounded-full object-cover border border-gold/50" loading="lazy">
                    <div class="group-hover:text-gold transition-colors flex-grow"><div class="font-bold">${barber.name}</div></div>
                    ${isTaken ? '<span class="text-red-500 text-xs font-bold uppercase">Ocupado</span>' : ''}
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
        return this.state.bookings.some(b => !b.is_deleted && !b.completed && b.date === date && b.time === time && b.barber_id === barberId);
    },

    renderSummary() {
        const barber = CONFIG.barbers.find(b => b.id === this.state.selectedBarber);
        const services = this.state.selectedServices.map(id => CONFIG.services.find(s => s.id === id).name).join(', ');
        document.getElementById('sum-service').innerText = services || 'No seleccionado';
        document.getElementById('sum-barber').innerText = barber ? barber.name : 'No seleccionado';
        document.getElementById('sum-date').innerText = this.state.selectedDate || 'No seleccionada';
        document.getElementById('sum-time').innerText = this.state.selectedTime || 'No seleccionada';
    },

    async confirmBooking() {
        const customerName = document.getElementById('customer-name').value;
        const customerPhone = document.getElementById('customer-phone').value;
        if (!customerName || !customerPhone) return alert('Ingresa nombre y teléfono.');
        const barber = CONFIG.barbers.find(b => b.id === this.state.selectedBarber);
        let totalCost = 0;
        const serviceNames = this.state.selectedServices.map(id => {
            const s = CONFIG.services.find(serv => serv.id === id);
            if (s) { totalCost += parseInt(s.price.replace(/\./g, '')); return s.name; }
            return 'Desconocido';
        });
        const booking = {
            customer_name: customerName,
            customer_phone: customerPhone,
            date: this.state.selectedDate,
            time: this.state.selectedTime,
            barber_id: this.state.selectedBarber,
            barber_name: barber ? barber.name : 'Desconocido',
            services: serviceNames,
            total_cost: totalCost.toLocaleString('pt-BR') + ' Gs',
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
        const message = `💈 *Cita Solicitada - Adan BarberClub* 💈\n\n👤 **Cliente:** ${booking.customer_name}\n✂️ **Servicios:** ${servicesText}\n💰 **Total:** ${booking.total_cost}\n👨‍🦱 **Barbero:** ${booking.barber_name}\n📅 **Fecha:** ${formattedDate}\n⏰ **Hora:** ${booking.time}\n\n*Por favor, confirma la disponibilidad de este espacio.*`;
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

        // Service IDs that count as "corte"
        const corteIds = ['clásico', 'moderno', 'corte_barba', 'corte_barba_perfil', 'full_exp'];
        // Map IDs to service names for comparison
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
                // No services info — count as other by default
                otherCount++;
                return;
            }
            // Check if ANY service in this booking is a haircut type
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

        // Calculate start of current week (Monday 00:00:00)
        const now = new Date();
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
        monday.setHours(0, 0, 0, 0);
        const weekStart = monday.getTime();

        // Filter completed bookings this week
        const weekBookings = this.state.bookings.filter(b =>
            b.completed === true && b.completed_at && b.completed_at >= weekStart
        );

        // Calculate total income and per-barber breakdown
        let totalIncome = 0;
        const barberIncome = {};
        CONFIG.barbers.forEach(b => { barberIncome[b.id] = 0; });

        weekBookings.forEach(b => {
            let cost = 0;
            if (b.total_cost) {
                // Parse stored format like "40.000 Gs"
                const parsed = parseInt(b.total_cost.replace(/\./g, '').replace(' Gs', ''));
                if (!isNaN(parsed)) cost = parsed;
            } else if (b.services && b.services.length > 0) {
                // Fallback: calculate from services list
                b.services.forEach(sName => {
                    const svc = CONFIG.services.find(s => s.name === sName);
                    if (svc) cost += parseInt(svc.price.replace(/\./g, ''));
                });
            }
            totalIncome += cost;
            if (b.barber_id && barberIncome[b.barber_id] !== undefined) {
                barberIncome[b.barber_id] += cost;
            }
        });

        // Update total
        incomeEl.textContent = totalIncome.toLocaleString('pt-BR');

        // Update per-barber breakdown
        barberBreakdownEl.innerHTML = CONFIG.barbers.map(b => {
            const income = barberIncome[b.id] || 0;
            return `<div class="border-l border-gold/10 first:border-l-0">
                        <div class="text-[10px] uppercase tracking-wider text-platinum">${b.name.split(' ')[0]}</div>
                        <div class="text-sm font-bold gold-text">${income.toLocaleString('pt-BR')}</div>
                    </div>`;
        }).join('');
    },

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
        body.innerHTML = filtered.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)).map(b => `
            <tr class="border-b border-gold/10 hover:bg-gold/5 transition-colors">
                <td class="py-4 px-4">${b.date}</td>
                <td class="py-4 px-4">${b.time}</td>
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
            </tr>
        `).join('');
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
window.onload = () => app.init();
