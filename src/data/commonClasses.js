const theme = (key) => (typeof window !== 'undefined' && window.theme) ? window.theme(key) : '';

export const disabledClasses = 'opacity-30 cursor-not-allowed pointer-events-none select-none';

const commonButtonClasses = `inline-flex items-center justify-center space-x-2 py-2 px-4 ${theme('input')} rounded-3xl transition-colors duration-150 cursor-pointer`;

export const buttonClasses = `${commonButtonClasses} ${theme('hoverBorder')} ${theme('bgSecondaryLight')}`;

export const buttonOutlineClasses = `bg-transparent border ${theme('border')} ${commonButtonClasses}`;

export const tabPillClasses = `py-2 px-4 text-xs cursor-pointer rounded-3xl ${theme('hover')}`;

export const labelPillClasses = `${theme('bgSecondaryLight')} text-sm font-normal me-2 px-2.5 py-0.5 rounded-full`;

export const linkClasses = `font-semibold underline ${theme('textSecondary')}`;

export const selectedRadioOrCheckboxClasses = `${theme('bgSecondaryLight')} ${theme('borderDark')}`;

export const individualRadioClasses = `inline-flex justify-between items-center p-5 w-full rounded-lg cursor-pointer border-2 ${theme('border')} ${theme('bgMain')} ${theme('checked')} ${theme('hover')}`;

export const individualCheckboxClasses = `inline-flex justify-between items-center p-5 w-full rounded-lg cursor-pointer border-2 ${theme('border')} ${theme('bgMain')} ${theme('hover')}`;
