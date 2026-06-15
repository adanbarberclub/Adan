/**
 * Adam Barber Club - Booking Logic
 * Implements a multi-step booking flow with LocalStorage persistence
 * and WhatsApp integration.
 */

const CONFIG = {
    whatsappNumber: '595994587337',
    staffPassword: 'admin',
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
        { id: 'cristhian', name: 'Cristhian Chávez', spec: 'Master Barber - Especialista en Fades' },
        { id: 'diego', name: 'Diego Adan', spec: 'Master Barber - Estilo Clásico & Tijera' },
        { id: 'ismael', name: 'Ismael Vázquez', spec: 'Master Barber - Especialista en Barba' },
    ],
    timeSlots: [
        '09:00', '10:00', '11:00', '12:00',
        '13:00', '14:00', '15:00', '16:00',
        '17:00', '18:00', '19:00'
    ],
    storageKey: 'adam_barber_bookings',
    deletedStorageKey: 'adam_barber_deleted_bookings',
    socialFeed: {
        instagram: [
            'img/Instagram image 1 change.jpg',
            'img/Instagram imagen 2.jpg'
        ],
        tiktok: [
            'img/Tiktok image 1.jpg',
            'img/Tiktok image 2.jpg'
        ]
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
    },

    init() {
        console.log('Adam Barber Club App Initialized');
        this.renderServices();
        this.setupDatePicker();
        // Update the main page barber section to match CONFIG
        this.syncMainPageBarbers();
        this.renderSocialFeed();
    },

    syncMainPageBarbers() {
        const barberCards = document.querySelectorAll('.barber-card');
        CONFIG.barbers.forEach((barber, index) => {
            if (barberCards[index]) {
                const nameEl = barberCards[index].querySelector('h3');
                if (nameEl) nameEl.innerText = barber.name;

                const btn = barberCards[index].querySelector('button');
                if (btn) {
                    btn.setAttribute('onclick', `app.selectBarberDirect('${barber.id}')`);
                }
            }
        });
    },

    renderSocialFeed() {
        const igContainer = document.getElementById('instagram-feed');
        const tkContainer = document.getElementById('tiktok-feed');
        if (!igContainer || !tkContainer) return;

        // Render Instagram Images
        igContainer.innerHTML = CONFIG.socialFeed.instagram.map(imgSrc => `
            <div class="group relative overflow-hidden rounded-sm border border-gold/20 bg-charcoal aspect-[9/16] cursor-pointer">
                <img src="${imgSrc}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Instagram Post">
                <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-obsidian/40">
                    <a href="https://www.instagram.com/adan_barberclub/" target="_blank" class="bg-gold text-obsidian p-3 rounded-full">
                        <i class="fa-brands fa-instagram"></i>
                    </a>
                </div>
            </div>
        `).join('');

        // Render TikTok Images
        tkContainer.innerHTML = CONFIG.socialFeed.tiktok.map(imgSrc => `
            <div class="group relative overflow-hidden rounded-sm border border-gold/20 bg-charcoal aspect-[9/16] cursor-pointer">
                <img src="${imgSrc}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="TikTok Post">
                <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-obsidian/40">
                    <a href="https://www.tiktok.com/@adanbarberclub?_r=1&_t=ZS-97DKcxu3ouq" target="_blank" class="bg-gold text-obsidian p-3 rounded-full">
                        <i class="fa-brands fa-tiktok"></i>
                    </a>
                </div>
            </div>
        `).join('');
    },

    // --- UI Helpers ---

    updateStepUI() {
        // Toggle step content visibility
        document.querySelectorAll('.step-content').forEach((el, idx) => {
            el.classList.toggle('active', idx + 1 === this.state.step);
        });

        // Update dots
        for (let i = 1; i <= 5; i++) {
            const dot = document.getElementById(`dot-${i}`);
            if (dot) {
                dot.classList.toggle('bg-gold', i === this.state.step);
                dot.classList.toggle('bg-platinum', i !== this.state.step);
            }
        }

        // Buttons
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

        // Contextual rendering
        if (this.state.step === 3) this.renderTimeSlots();
        if (this.state.step === 4) this.renderBarbers();
        if (this.state.step === 5) this.renderSummary();
    },

    nextStep() {
        if (this.state.step === 1 && this.state.selectedServices.length === 0) {
            alert('Por favor, selecciona al menos un servicio.');
            return;
        }
        if (this.state.step === 2 && !this.state.selectedDate) {
            alert('Por favor, selecciona una fecha.');
            return;
        }
        if (this.state.step === 3 && !this.state.selectedTime) {
            alert('Por favor, selecciona un horario.');
            return;
        }
        if (this.state.step === 4 && !this.state.selectedBarber) {
            alert('Por favor, selecciona un maestro.');
            return;
        }

        if (this.state.step < 5) {
            this.state.step++;
            this.updateStepUI();
        }
    },

    prevStep() {
        if (this.state.step > 1) {
            this.state.step--;
            this.updateStepUI();
        }
    },

    // --- Step 1: Services ---

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
        if (index > -1) {
            this.state.selectedServices.splice(index, 1);
        } else {
            this.state.selectedServices.push(serviceId);
        }
        this.renderServices();
    },

    // --- Step 2: Date ---

    setupDatePicker() {
        this.renderCalendar();
    },

    renderCalendar() {
        const grid = document.getElementById('calendar-grid');
        const monthEl = document.getElementById('calendar-month');
        if (!grid || !monthEl) return;

        const year = this.state.viewYear;
        const month = this.state.viewMonth;

        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

        monthEl.innerText = `${monthNames[month]} ${year}`;

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startOffset = firstDay;

        const daysHeader = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
        let html = daysHeader.map(d => `<div class="text-platinum/50 font-bold text-[10px] uppercase">${d}</div>`).join('');

        for (let i = 0; i < startOffset; i++) {
            html += `<div></div>`;
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isPast = new Date(dateStr) < new Date().setHours(0,0,0,0);
            const isSelected = this.state.selectedDate === dateStr;

            html += `
                <div onclick="${isPast ? '' : `app.selectDate('${dateStr}')`}"
                     class="p-2 cursor-pointer transition-all border ${isSelected ? 'bg-gold text-obsidian border-gold font-bold' : 'border-gold/10 text-white hover:border-gold'}
                     ${isPast ? 'opacity-20 cursor-not-allowed' : ''}">
                    ${day}
                </div>`;
        }

        grid.innerHTML = html;
    },

    changeMonth(delta) {
        this.state.viewMonth += delta;
        if (this.state.viewMonth > 11) {
            this.state.viewMonth = 0;
            this.state.viewYear++;
        } else if (this.state.viewMonth < 0) {
            this.state.viewMonth = 11;
            this.state.viewYear--;
        }
        this.renderCalendar();
    },

    selectDate(date) {
        this.state.selectedDate = date;
        this.renderCalendar();
    },

    // --- Step 3: Time Slots ---

    renderTimeSlots() {
        const container = document.getElementById('time-slots');
        if (!container) return;

        container.innerHTML = CONFIG.timeSlots.map(slot => {
            // Check if the slot is totally occupied (all barbers taken)
            const isFull = CONFIG.barbers.every(barber => this.isSlotTaken(this.state.selectedDate, slot, barber.id));

            // If a barber is already selected (e.g., from home page), check if that specific barber is taken
            let isSpecificBarberTaken = false;
            if (this.state.selectedBarber) {
                isSpecificBarberTaken = this.isSlotTaken(this.state.selectedDate, slot, this.state.selectedBarber);
            }

            const isSelected = this.state.selectedTime === slot;
            const isDisabled = isFull || isSpecificBarberTaken;

            return `
                <div onclick="${isDisabled ? '' : `app.selectTime('${slot}')`}"
                     class="p-2 text-center border cursor-pointer transition-all flex flex-col justify-center
                     ${isDisabled ? 'border-platinum/20 text-platinum/30 cursor-not-allowed opacity-50' : 'border-gold/30 hover:border-gold'}
                     ${isSelected ? 'bg-gold text-obsidian font-bold' : 'text-white'}
                     ${isSpecificBarberTaken && !isFull ? 'border-red-500/50 bg-red-900/10' : ''}">
                    <span class="text-sm">${slot}</span>
                    ${isSpecificBarberTaken && !isFull ? '<span class="text-[8px] text-red-500 font-bold uppercase">Ocupado</span>' : ''}
                </div>
            `;
        }).join('');
    },

    selectTime(slot) {
        this.state.selectedTime = slot;
        this.renderTimeSlots();
    },

    // --- Step 4: Barbers ---

    renderBarbers() {
        const container = document.getElementById('barber-options');
        if (!container) return;

        container.innerHTML = CONFIG.barbers.map(barber => {
            const isTaken = this.isSlotTaken(this.state.selectedDate, this.state.selectedTime, barber.id);
            const isSelected = this.state.selectedBarber === barber.id;

            return `
                <div onclick="${isTaken ? `app.handleBarberTaken('${barber.name}')` : `app.selectBarber('${barber.id}')`}"
                     class="p-4 bg-obsidian border ${isSelected ? 'border-gold bg-gold/10' : 'border-gold/30'} cursor-pointer hover:border-gold transition-all flex justify-between items-center group
                     ${isTaken ? 'opacity-60' : ''}">
                    <div class="group-hover:text-gold transition-colors">
                        <div class="font-bold">${barber.name}</div>
                    </div>
                    ${isTaken ? '<span class="text-red-500 text-xs font-bold">OCUPADO</span>' : ''}
                </div>
            `;
        }).join('');
    },

    selectBarber(id) {
        this.state.selectedBarber = id;
        this.renderBarbers();
    },

    handleBarberTaken(name) {
        alert(`Lo sentimos, ${name} ya tiene una cita en este horario. Por favor, elige otro maestro o cambia la hora.`);
    },

    selectBarberDirect(id) {
        this.openBooking();
        this.state.selectedBarber = id;
        // Jump to barber selection if they came from the main page
        this.state.step = 4;
        this.updateStepUI();
        // Note: they still need to pick service, date, and time.
        // For better UX, we might want to force them through the flow,
        // but the request was "Select Barbero" as a step.
        // Let's just set the barber and stay at step 1 or jump to 4 and let them go back.
        // We'll keep them at step 1 so they complete the required info.
        this.state.step = 1;
        this.updateStepUI();
    },

    // --- Persistence & Finalization ---

    getBookings() {
        const data = localStorage.getItem(CONFIG.storageKey);
        return data ? JSON.parse(data) : [];
    },

    getDeletedBookings() {
        const data = localStorage.getItem(CONFIG.deletedStorageKey);
        if (!data) return [];

        const deleted = JSON.parse(data);
        const now = Date.now();
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

        // Filter out bookings deleted more than 7 days ago
        const filtered = deleted.filter(b => {
            if (!b.deletedAt) return true; // Keep if no date (legacy)
            return (now - b.deletedAt) < sevenDaysMs;
        });

        // Only update storage if something was actually removed
        if (filtered.length !== deleted.length) {
            localStorage.setItem(CONFIG.deletedStorageKey, JSON.stringify(filtered));
        }

        return filtered;
    },

    isSlotTaken(date, time, barberId) {
        if (!date || !time) return false;
        const bookings = this.getBookings();
        return bookings.some(b => b.date === date && b.time === time && b.barberId === barberId);
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

    confirmBooking() {
        const customerName = document.getElementById('customer-name').value;
        const customerPhone = document.getElementById('customer-phone').value;

        if (!customerName || !customerPhone) {
            alert('Por favor, ingresa tu nombre y teléfono.');
            return;
        }

        const barber = CONFIG.barbers.find(b => b.id === this.state.selectedBarber);

        // Map and calculate totals
        let totalCost = 0;
        const serviceNames = this.state.selectedServices.map(id => {
            const s = CONFIG.services.find(serv => serv.id === id);
            if (s) {
                totalCost += parseInt(s.price.replace(/\./g, ''));
                return s.name;
            }
            return 'Desconocido';
        });

        const booking = {
            customerName,
            customerPhone,
            date: this.state.selectedDate,
            time: this.state.selectedTime,
            barberId: this.state.selectedBarber,
            barberName: barber ? barber.name : 'Desconocido',
            services: serviceNames,
            totalCost: totalCost.toLocaleString('pt-BR') + ' Gs'
        };

        const bookings = this.getBookings();
        bookings.push(booking);
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(bookings));

        this.sendWhatsApp(booking);
    },

    sendWhatsApp(booking) {
        const servicesText = booking.services.join(', ');

        // Format date nicely (e.g., 15 de Junio)
        const dateObj = new Date(booking.date + 'T00:00:00');
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        const formattedDate = `${dateObj.getDate()} de ${monthNames[dateObj.getMonth()]}`;

        const message = `💈 *Cita Solicitada - Adan BarberClub* 💈\n\n` +
                        `👤 **Cliente:** ${booking.customerName}\n` +
                        `✂️ **Servicios:** ${servicesText}\n` +
                        `💰 **Total:** ${booking.totalCost}\n` +
                        `👨‍🦱 **Barbero:** ${booking.barberName}\n` +
                        `📅 **Fecha:** ${formattedDate}\n` +
                        `⏰ **Hora:** ${booking.time}\n\n` +
                        `*Por favor, confirma la disponibilidad de este espacio.*`;

        const encodedMsg = encodeURIComponent(message);
        const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodedMsg}`;

        window.open(url, '_blank');
        this.closeBooking();
    },

    // --- Staff Panel ---

    openStaffLogin() {
        document.getElementById('staff-modal').classList.remove('hidden');
        document.getElementById('staff-login-view').classList.remove('hidden');
        document.getElementById('staff-agenda-view').classList.add('hidden');
    },

    verifyStaff() {
        const pin = document.getElementById('staff-pin').value;
        if (pin === CONFIG.staffPassword) {
            document.getElementById('staff-login-view').classList.add('hidden');
            document.getElementById('staff-agenda-view').classList.remove('hidden');
            this.populateBarberFilter();
            this.renderStaffBookings();
        } else {
            alert('PIN incorrecto');
        }
    },

    logoutStaff() {
        document.getElementById('staff-pin').value = '';
        this.closeStaff();
    },

    closeStaff() {
        document.getElementById('staff-modal').classList.add('hidden');
    },

    handleBookingAction(index) {
        const isDeletedView = this.state.showDeleted;
        const currentList = isDeletedView ? this.getDeletedBookings() : this.getBookings();
        const booking = currentList[index];

        if (!isDeletedView) {
            if (confirm(`¿Estás seguro de que deseas eliminar la cita de ${booking.customerName}?`)) {
                const active = this.getBookings();
                const deleted = this.getDeletedBookings();

                active.splice(index, 1);
                deleted.push(booking);

                localStorage.setItem(CONFIG.storageKey, JSON.stringify(active));
                localStorage.setItem(CONFIG.deletedStorageKey, JSON.stringify(deleted));
                this.renderStaffBookings();
            }
        } else {
            if (confirm(`¿Deseas restaurar la cita de ${booking.customerName}?`)) {
                const active = this.getBookings();
                const deleted = this.getDeletedBookings();

                deleted.splice(index, 1);
                active.push(booking);

                localStorage.setItem(CONFIG.storageKey, JSON.stringify(active));
                localStorage.setItem(CONFIG.deletedStorageKey, JSON.stringify(deleted));
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

        const bookings = this.state.showDeleted ? this.getDeletedBookings() : this.getBookings();

        const filtered = filterBarberId === 'all'
            ? bookings
            : bookings.filter(b => b.barberId === filterBarberId);

        if (filtered.length === 0) {
            body.innerHTML = '<tr><td colspan="6" class="py-8 text-center opacity-50 italic">No hay citas programadas.</td></tr>';
            return;
        }

        body.innerHTML = filtered.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)).map((b, idx) => `
            <tr class="border-b border-gold/10 hover:bg-gold/5 transition-colors">
                <td class="py-4 px-4">${b.date}</td>
                <td class="py-4 px-4">${b.time}</td>
                <td class="py-4 px-4">${b.barberName}</td>
                <td class="py-4 px-4">${b.services.join(', ')}</td>
                <td class="py-4 px-4">${b.customerName}</td>
                <td class="py-4 px-4">
                    <button onclick="app.handleBookingAction(${idx})" class="text-xs uppercase p-1 border ${this.state.showDeleted ? 'border-green-600 text-green-500 hover:bg-green-600 hover:text-white' : 'border-red-600 text-red-500 hover:bg-red-600 hover:text-white'} transition-all">
                        ${this.state.showDeleted ? 'Restaurar' : 'Eliminar'}
                    </button>
                </td>
            </tr>
        `).join('');
    },

    // --- Modal Control ---
    openBooking() {
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

// Global aliases for HTML onclick events
window.openBooking = () => app.openBooking();
window.closeBooking = () => app.closeBooking();
window.changeStep = (delta) => {
    if (delta > 0) app.nextStep();
    else app.prevStep();
};
window.openStaffLogin = () => app.openStaffLogin();
window.verifyStaff = () => app.verifyStaff();
window.logoutStaff = () => app.logoutStaff();
window.closeStaff = () => app.closeStaff();

window.onload = () => app.init();
