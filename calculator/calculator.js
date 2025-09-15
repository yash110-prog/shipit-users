// Global variables
let display = document.getElementById('display');
let currentInput = '';
let operator = '';
let previousInput = '';
let memory = 0;
let isNewCalculation = false;

// Initialize calculator on page load
window.onload = function () {
    display.value = '0'; // Fix: Level 1 - Initialize display
};

// Check if a value is an operator
function isOperator(value) {
    return ['+', '-', '*', '/'].includes(value);
}

// Append value to display
function appendToDisplay(value) {
    if (isNewCalculation && !isOperator(value)) {
        currentInput = '';
        isNewCalculation = false;
    }

    if (isOperator(value)) {
        if (currentInput === '' && value === '-') {
            // Allow negative numbers
            currentInput += value;
        } else if (currentInput !== '') {
            if (previousInput !== '' && operator !== '') {
                calculate(); // Fix: Handles chain calculations
            }
            operator = value;
            previousInput = currentInput;
            currentInput = '';
        }
    } else {
        // Fix: Prevent multiple decimal points
        if (value === '.' && currentInput.includes('.')) return;
        currentInput += value;
    }

    updateDisplay();
}

// Update display
function updateDisplay() {
    if (currentInput === '') {
        display.value = previousInput || '0';
    } else {
        display.value = currentInput;
    }
}

// Clear display
function clearDisplay() {
    currentInput = '';
    operator = '';
    previousInput = '';
    isNewCalculation = false;
    display.value = '0';
}

// Perform calculation
function calculate() {
    if (previousInput === '' || currentInput === '' || operator === '') {
        return;
    }

    let prev = parseFloat(previousInput);
    let current = parseFloat(currentInput);
    let result;

    switch (operator) {
        case '+':
            result = prev + current;
            break;
        case '-':
            result = prev - current;
            break;
        case '*':
            result = prev * current;
            break;
        case '/':
            if (current === 0) { // Fix: Handle division by zero
                display.value = "Error";
                currentInput = '';
                previousInput = '';
                operator = '';
                return;
            }
            result = prev / current;
            break;
        default:
            return;
    }

    // Fix: Floating point precision issues
    result = parseFloat(result.toFixed(10));

    currentInput = result.toString();
    operator = '';
    previousInput = currentInput; // Fix: Keep result for chain calculations
    isNewCalculation = true;
    updateDisplay();
}

// Delete last character
function deleteLast() {
    if (currentInput.length > 0) {
        currentInput = currentInput.slice(0, -1);
        if (currentInput === '') {
            currentInput = '0';
        }
        updateDisplay();
    }
}

// Memory functions
function memoryStore() {
    if (currentInput !== '') {
        memory = parseFloat(currentInput);
    } else {
        memory = parseFloat(display.value);
    }
}

function memoryRecall() {
    currentInput = memory.toString();
    updateDisplay();
}

function memoryClear() {
    memory = 0;
}

function memoryAdd() {
    let value = currentInput !== '' ? parseFloat(currentInput) : parseFloat(display.value);
    memory += value;

    // Fix: Prevent memory overflow (limit to safe range)
    if (memory > Number.MAX_SAFE_INTEGER) memory = Number.MAX_SAFE_INTEGER;
    if (memory < Number.MIN_SAFE_INTEGER) memory = Number.MIN_SAFE_INTEGER;
}

// Keyboard input support
document.addEventListener('keydown', function (event) {
    const key = event.key;

    if (!isNaN(key)) {
        appendToDisplay(key); // Numbers
    } else if (isOperator(key)) {
        appendToDisplay(key);
    } else if (key === '.') {
        appendToDisplay('.');
    } else if (key === 'Enter' || key === '=') {
        calculate();
    } else if (key === 'Backspace') {
        deleteLast();
    } else if (key.toLowerCase() === 'c') {
        clearDisplay();
    }
});
