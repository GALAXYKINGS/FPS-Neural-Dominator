// Multi-Timezone Digital Clock Application

/**
 * Main application state
 */
const clockApp = {
    // Store active timezones
    activeTimezones: [],
    
    // Update interval (1 second)
    updateInterval: null,
    
    // DOM element references
    elements: {
        primaryTime: null,
        primaryDate: null,
        timezoneSelect: null,
        addTimezoneBtn: null,
        clocksContainer: null,
        emptyState: null
    },

    /**
     * Initialize the application
     */
    init() {
        // Cache DOM elements
        this.elements.primaryTime = document.getElementById('primaryTime');
        this.elements.primaryDate = document.getElementById('primaryDate');
        this.elements.timezoneSelect = document.getElementById('timezoneSelect');
        this.elements.addTimezoneBtn = document.getElementById('addTimezoneBtn');
        this.elements.clocksContainer = document.getElementById('clocksContainer');
        this.elements.emptyState = document.getElementById('emptyState');

        // Set up event listeners
        this.setupEventListeners();

        // Load saved timezones from localStorage
        this.loadSavedTimezones();

        // Start the clock updates
        this.startClock();

        // Initial render
        this.updateAllClocks();
    },

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        this.elements.addTimezoneBtn.addEventListener('click', () => this.addTimezone());
        
        // Allow adding timezone by pressing Enter in select
        this.elements.timezoneSelect.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTimezone();
            }
        });
    },

    /**
     * Start the clock update interval
     */
    startClock() {
        // Update immediately
        this.updateAllClocks();
        
        // Then update every second
        this.updateInterval = setInterval(() => {
            this.updateAllClocks();
        }, 1000);
    },

    /**
     * Update all clocks (primary and world clocks)
     */
    updateAllClocks() {
        this.updatePrimaryClock();
        this.updateWorldClocks();
    },

    /**
     * Update the primary clock (local time)
     */
    updatePrimaryClock() {
        const now = new Date();
        
        // Format time
        const timeString = this.formatTime(now);
        this.elements.primaryTime.textContent = timeString;
        
        // Format date
        const dateString = this.formatDate(now);
        this.elements.primaryDate.textContent = dateString;
    },

    /**
     * Update all world clocks
     */
    updateWorldClocks() {
        this.activeTimezones.forEach((timezone, index) => {
            const clockCard = document.querySelector(`[data-timezone-id="${timezone.id}"]`);
            if (clockCard) {
                const now = new Date();
                const timeString = this.formatTime(now, timezone.value);
                const dateString = this.formatDate(now, timezone.value);
                
                const timeElement = clockCard.querySelector('.clock-time');
                const dateElement = clockCard.querySelector('.clock-date');
                
                if (timeElement) timeElement.textContent = timeString;
                if (dateElement) dateElement.textContent = dateString;
            }
        });
    },

    /**
     * Format time for display
     * @param {Date} date - Date object to format
     * @param {string} timezone - Optional timezone string
     * @returns {string} Formatted time string
     */
    formatTime(date, timezone = null) {
        const options = {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };
        
        if (timezone) {
            options.timeZone = timezone;
        }
        
        return date.toLocaleTimeString('en-US', options);
    },

    /**
     * Format date for display
     * @param {Date} date - Date object to format
     * @param {string} timezone - Optional timezone string
     * @returns {string} Formatted date string
     */
    formatDate(date, timezone = null) {
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        
        if (timezone) {
            options.timeZone = timezone;
        }
        
        return date.toLocaleDateString('en-US', options);
    },

    /**
     * Get timezone abbreviation
     * @param {string} timezone - Timezone string
     * @returns {string} Timezone abbreviation
     */
    getTimezoneAbbreviation(timezone) {
        try {
            const date = new Date();
            const formatted = date.toLocaleTimeString('en-US', {
                timeZone: timezone,
                timeZoneName: 'short'
            });
            
            // Extract the timezone abbreviation (e.g., "PST", "EST")
            const parts = formatted.split(' ');
            return parts[parts.length - 1];
        } catch (error) {
            return 'N/A';
        }
    },

    /**
     * Add a new timezone
     */
    addTimezone() {
        const select = this.elements.timezoneSelect;
        const selectedValue = select.value;
        const selectedText = select.options[select.selectedIndex].text;
        
        // Validate selection
        if (!selectedValue) {
            this.showNotification('Please select a timezone', 'warning');
            return;
        }
        
        // Check if timezone already exists
        if (this.activeTimezones.some(tz => tz.value === selectedValue)) {
            this.showNotification('This timezone is already added', 'warning');
            return;
        }
        
        // Create timezone object
        const timezone = {
            id: Date.now(),
            value: selectedValue,
            name: selectedText
        };
        
        // Add to active timezones
        this.activeTimezones.push(timezone);
        
        // Save to localStorage
        this.saveTimezones();
        
        // Render the new clock
        this.renderClockCard(timezone);
        
        // Update empty state
        this.updateEmptyState();
        
        // Reset select
        select.value = '';
        
        // Show success notification
        this.showNotification(`Added ${selectedText}`, 'success');
    },

    /**
     * Remove a timezone
     * @param {number} timezoneId - ID of timezone to remove
     */
    removeTimezone(timezoneId) {
        // Find the timezone
        const timezone = this.activeTimezones.find(tz => tz.id === timezoneId);
        if (!timezone) return;
        
        // Remove from active timezones
        this.activeTimezones = this.activeTimezones.filter(tz => tz.id !== timezoneId);
        
        // Save to localStorage
        this.saveTimezones();
        
        // Remove the clock card
        const clockCard = document.querySelector(`[data-timezone-id="${timezoneId}"]`);
        if (clockCard) {
            clockCard.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                clockCard.remove();
                this.updateEmptyState();
            }, 300);
        }
        
        // Show notification
        this.showNotification(`Removed ${timezone.name}`, 'info');
    },

    /**
     * Render a clock card
     * @param {object} timezone - Timezone object
     */
    renderClockCard(timezone) {
        const clockCard = document.createElement('div');
        clockCard.className = 'clock-card';
        clockCard.setAttribute('data-timezone-id', timezone.id);
        
        // Extract location name from timezone
        const locationName = this.extractLocationName(timezone.name);
        const tzAbbr = this.getTimezoneAbbreviation(timezone.value);
        
        // Get current time and date for this timezone
        const now = new Date();
        const timeString = this.formatTime(now, timezone.value);
        const dateString = this.formatDate(now, timezone.value);
        
        clockCard.innerHTML = `
            <div class="clock-header">
                <div class="clock-location">${locationName}</div>
                <button class="btn-remove" data-timezone-id="${timezone.id}" title="Remove timezone">
                    ×
                </button>
            </div>
            <div class="clock-time">${timeString}</div>
            <div class="clock-date">${dateString}</div>
            <div class="clock-timezone">${tzAbbr}</div>
        `;
        
        // Add remove button listener
        const removeBtn = clockCard.querySelector('.btn-remove');
        removeBtn.addEventListener('click', () => this.removeTimezone(timezone.id));
        
        // Add to container
        this.elements.clocksContainer.appendChild(clockCard);
    },

    /**
     * Extract location name from timezone string
     * @param {string} timezoneString - Full timezone string
     * @returns {string} Location name
     */
    extractLocationName(timezoneString) {
        // Extract the city name before the parentheses
        const match = timezoneString.match(/^([^(]+)/);
        return match ? match[1].trim() : timezoneString;
    },

    /**
     * Update empty state visibility
     */
    updateEmptyState() {
        if (this.activeTimezones.length === 0) {
            this.elements.emptyState.classList.remove('hidden');
        } else {
            this.elements.emptyState.classList.add('hidden');
        }
    },

    /**
     * Save timezones to localStorage
     */
    saveTimezones() {
        try {
            localStorage.setItem('activeTimezones', JSON.stringify(this.activeTimezones));
        } catch (error) {
            console.error('Error saving timezones:', error);
        }
    },

    /**
     * Load saved timezones from localStorage
     */
    loadSavedTimezones() {
        try {
            const saved = localStorage.getItem('activeTimezones');
            if (saved) {
                this.activeTimezones = JSON.parse(saved);
                
                // Render all saved clocks
                this.activeTimezones.forEach(timezone => {
                    this.renderClockCard(timezone);
                });
                
                // Update empty state
                this.updateEmptyState();
            }
        } catch (error) {
            console.error('Error loading timezones:', error);
            this.activeTimezones = [];
        }
    },

    /**
     * Show notification to user
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, warning, info)
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background: ${type === 'success' ? '#4ade80' : type === 'warning' ? '#fbbf24' : '#667eea'};
            color: white;
            border-radius: 10px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            animation: slideIn 0.3s ease;
            font-weight: 500;
        `;
        
        // Add to body
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
};

// Add notification animations to document
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: scale(1);
        }
        to {
            opacity: 0;
            transform: scale(0.9);
        }
    }
`;
document.head.appendChild(style);

// Initialize the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => clockApp.init());
} else {
    clockApp.init();
}
