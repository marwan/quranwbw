export const disabledClasses = 'opacity-30 cursor-not-allowed pointer-events-none select-none';

const commonButtonClasses = 'inline-flex items-center justify-center space-x-2 py-2 px-4 focus:border-theme-accent focus:ring-theme-accent rounded-3xl transition-colors duration-150 cursor-pointer';

export const buttonClasses = `${commonButtonClasses} border border-transparent hover:border-theme-accent bg-theme-accent/5`;

export const buttonOutlineClasses = `bg-transparent border border-theme-accent/20 ${commonButtonClasses}`;

export const tabPillClasses = 'py-2 px-4 text-xs cursor-pointer rounded-3xl hover:bg-theme-accent/5';

export const labelPillClasses = 'bg-theme-accent/5 text-sm font-normal me-2 px-2.5 py-0.5 rounded-full';

export const linkClasses = 'font-semibold underline text-theme-accent';

export const selectedRadioOrCheckboxClasses = 'bg-theme-accent/5 !border-theme-accent';

export const individualRadioClasses = 'inline-flex justify-between items-center p-5 w-full rounded-lg cursor-pointer border-2 border-theme-accent/20 bg-theme-bg peer-checked:border-2 peer-checked:border-theme-accent hover:bg-theme-accent/5';

export const individualCheckboxClasses = 'inline-flex justify-between items-center p-5 w-full rounded-lg cursor-pointer border-2 border-theme-accent/20 bg-theme-bg hover:bg-theme-accent/5';
