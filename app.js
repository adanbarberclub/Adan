/**
 * Adam Barber Club - Booking Logic
 * High Performance Mode with Real-time Cloud Synchronization
 */

const CONFIG = {
    whatsappNumber: '595994587337',
    staffPassword: 'admin',

    // --- SUPABASE CONFIGURATION ---
    supabaseUrl: 'https://khvpksklcwyfmsxsgyde.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtodnBrc2tsY3d5Zm1zeHNneWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NTgwMzEsImV4cCI6MjA5NzEzNDAzMX0.Rq0_mWYC3jeWUTHb81eXaAmHoWFHDqCTjaIA2J9e5rE',
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
    timeSlots: [
        '09:00', '10:00', '11:00', '12:00',
        '13:00', '14:00', '15:00', '16:00',
        '17:00', '18:00', '19:00'
    ],
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
        showDeleted: false,
        bookings: [],
        isCloudConnected: false
    },

    init() {
        this.renderServices();
        this.setupDatePicker();
        this.syncMainPageBarbers();
        this.renderSocialFeed();
        this.initSupabase();
        this.loadBookings();

        // Sincronización agresiva cada 15 segundos para asegurar actualización
        setInterval(() => this.loadBookings(), 15000);
    },

    initSupabase() {
        if (CONFIG.supabaseUrl && CONFIG.supabaseKey) {
            try {
                this.supabase = supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);
                this.state.isCloudConnected = true;

                // Habilitar Realtime (Suscripción a cambios en la tabla)
                this.setupRealtime();
            } catch (e) {
                this.state.isCloudConnected = false;
            }
        }
    },

    setupRealtime() {
        try {
            this.supabase
                .channel('bookings-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
                    console.log('☁️ Cambio detectado en la nube, actualizando...');
                    this.loadBookings();
                })
                .subscribe();
        } catch (e) {
            console.error('Realtime error:', e);
        }
    },

    async loadBookings() {
        const cached = localStorage.getItem(CONFIG.storageKey);
        if (cached) this.state.bookings = JSON.parse(cached);

        if (this.state.isCloudConnected) {
            try {
                const { data, error } = await this.supabase
                    .from('bookings')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (!error && data) {
                    this.state.bookings = data;
                    localStorage.setItem(CONFIG.storageKey, JSON.stringify(data));
                    this.refreshUIComponents();
                }
            } catch (e) {
                console.error('Sync error:', e);
            }
        }
    },

    refreshUIComponents() {
        if (this.state.step === 3) this.renderTimeSlots();
        if (this.state.step === 4) this.renderBarbers();
        if (!document.getElementById('staff-agenda-view').classList.contains('hidden')) {
            this.renderStaffBookings();
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
                <img src="${imgSrc}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Instagram Post">
                <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-obsidian/40">
                    <a href="https://www.instagram.com/adan_barberclub/" target="_blank" class="bg-gold text-obsidian p-3 rounded-full"><i class="fa-brands fa-instagram"></i></a>
                </div>
            </div>
        `).join('');
        tkContainer.innerHTML = CONFIG.socialFeed.tiktok.map(imgSrc => `
            <div class="group relative overflow-hidden rounded-sm border border-gold/20 bg-charcoal aspect-[9/16] cursor-pointer">
                <img src="${imgSrc}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="TikTok Post">
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
                 class="p-4 bg-obsidian border ${this.state.selected laL.includes(service.id) ? 'border-gold bg-gold/10' : 'border-gold/30'} cursor-pointer hover:border-gold transition-all flex justify-between items-center group">
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
                    <img src="${barber.img}" class="w-12 h-12 rounded-full object-cover border border-gold/50">
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
        return this.state.bookings.some(b => !b.is_deleted && b.date === date && b.time === time && b.barber_id === barberId);
    },

    renderSummary() {
        const barber = CONFIG.barbers.find(b => b.id === this.state.selectedBarber);
        const services = this.state.selectedServices.map(id => CONFIG.services.find(s => s.id === id).name).join(', ');
        document.getElementById('sum-service').innerText = services || 'No seleccionado';
        document.getElementById('sum-barber').innerText = barber ? barber.name : 'No seleccionado';
        document.getElementById('sum-date').innerText = this.state.selectedDate || 'No seleccionada';
        document.getElementById('sum-time').innerText = this.state.selectedTime || 'No seleccionada';
        document.getElementById('sum-name').innerText = document.getElementById('customer-name').value || 'No ingresado';
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
            is_deleted: false
        };
        if (this.state.isCloudConnected) {
            try {
                const { error } = await this.supabase.from('bookings').insert([booking]);
                if (error) throw error;
                await this.loadBookings();
            } catch (e) {
                console.error('Cloud save error:', e);
                alert('Guardado localmente (Error en nube).');
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
            await this.loadBookings();
            this.renderStaffBookings();
        } else alert('PIN incorrecto');
    },

    logoutStaff() {
        document.getElementById('staff-pin').value = '';
        this.closeStaff();
    },

    closeStaff() { document.getElementById('staff-modal').classList.add('hidden'); },

    async markAsCompleted(index) {
        const booking = this.state.bookings[index];
        if (confirm(`¿Cita realizada?`)) {
            if (this.state.isCloudConnected) await this.supabase.from('bookings').delete().eq('id', booking.id);
            this.state.bookings.splice(index, 1);
            localStorage.setItem(CONFIG.storageKey, JSON.stringify(this.state.bookings));
            this.renderStaffBookings();
        }
    },

    async handleBookingAction(index) {
        const isDeletedView = this.state.showDeleted;
        const currentList = isDeletedView ? this.state.bookings.filter(b => b.is_deleted) : this.state.bookings.filter(b => !b.is_deleted);
        const booking = currentList[index];
        if (!isDeletedView) {
            if (confirm(`¿Eliminar cita de ${booking.customer_name}?`)) {
                if (this.state.isCloudConnected) await this.supabase.from('bookings').update({ is_deleted: true }).eq('id', booking.id);
                const bIdx = this.state.bookings.findIndex(b => b.id === booking.id);
                this.state.bookings[bIdx].is_deleted = true;
                localStorage.setItem(CONFIG.storageKey, JSON.stringify(this.state.bookings));
                this.renderStaffBookings();
            }
        } else {
            if (confirm(`¿Restaurar cita de ${booking.customer_name}?`)) {
                if (this.state.isCloudConnected) await this.supabase.from('bookings').update({ is_deleted: false }).eq('id', booking.id);
                const bIdx = this.state.bookings.findIndex(b => b.id === booking.id);
                this.state.bookings[bIdx].is_deleted = false;
                localStorage.setItem(CONFIG.storageKey, JSON.stringify(this.state.bookings));
                this.renderStaffBookings();
            }
        }
    },

    toggleDeletedView() {
        this.state.showDeleted = !this.state.showDeleted;
        const btn = document.getElementById('btn-toggle-deleted');
        if (btn) {
            btn.innerText = this.state.showDeleted ? 'Ver Activas' : 'Ver Eliminadas';
            btn.classList.toggle('border-gold', this.state.showDeleted);
        }
        this.renderStaffBookings();
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

    renderStaffBookings() {
        const filterBarberId = document.getElementById('filter-barber').value;
        const body = document.getElementById('bookings-body');
        if (!body) return;
        const bookings = this.state.showDeleted ? this.state.bookings.filter(b => b.is_deleted) : this.state.bookings.filter(b => !b.is_deleted);
        const filtered = filterBarberId === 'all' ? bookings : bookings.filter(b => b.barber_id === filterBarberId);
        if (filtered.length === 0) {
            body.innerHTML = '<tr><td colspan="6" class="py-8 text-center opacity-50 italic">No hay citas programadas.</td></tr>';
            return;
        }
        body.innerHTML = filtered.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)).map((b, idx) => `
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
                        ${!this.state.showDeleted ? `<button onclick="app.markAsCompleted(${idx})" class="text-xs uppercase p-1 border border-green-600 text-green-500 hover:bg-green-600 hover:text-white transition-all">Realizado</button>` : ''}
                        <button onclick="app.handleBookingAction(${idx})" class="text-xs uppercase p-1 border ${this.state.showDeleted ? 'border-green-600 text-green-500 hover:bg-green-600 hover:text-white' : 'border-red-600 text-red-500 hover:bg-red-600 hover:text-white'} transition-all">${this.state.showDeleted ? 'Restaurar' : 'Eliminar'}</button>
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
