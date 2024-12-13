export const styles = {
  rounded: {
    modal: 'rounded-2xl',
    card: 'rounded-2xl',
    button: 'rounded-xl',
    input: 'rounded-lg'
  },

  padding: {
    modal: 'p-6',
    card: 'p-6',
    page: 'pt-4 px-4 pb-8',
    section: 'space-y-8 pt-2 px-6 pb-8',
    input: 'px-3.5 py-2.5',
    button: 'px-6 py-2.5'
  },

  text: {
    heading: 'text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600',
    subheading: 'text-xl font-bold text-gray-900',
    body: 'text-base text-gray-600',
    label: 'text-sm font-medium text-gray-700',
    input: 'text-base text-gray-900',
    tableHeader: 'text-sm font-bold text-gray-500 uppercase',
    cardTitle: 'text-lg font-semibold text-gray-900 group-hover:text-gray-800 transition-colors duration-200',
    cardSubtitle: 'text-sm font-medium text-gray-500',
    cardBody: 'text-base text-gray-600'
  },

  colors: {
    input: 'bg-white border border-gray-200',
    inputFocus: 'focus:ring-2 focus:ring-primary/10 focus:border-primary',
    buttonPrimary: 'bg-primary text-white hover:bg-primary/90',
    buttonSecondary: 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200',
    cardGradient: 'bg-gradient-to-br from-gray-50/50 to-transparent'
  },

  components: {
    input: 'w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-base text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary/10 focus:border-primary transition-shadow',
    button: 'inline-flex items-center px-6 py-2.5 font-medium transition-colors disabled:opacity-50',
    buttonPrimary: 'inline-flex items-center px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50',
    card: 'relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-100/50 shadow-sm hover:shadow-md transition-all duration-200',
    modal: 'bg-white rounded-2xl border border-gray-100',
    list: {
      container: 'space-y-4',
      grid: {
        default: 'grid items-center gap-4',
        waiting: 'grid-cols-[2fr_repeat(2,1fr)_auto]',
        paid: 'grid-cols-[2fr_repeat(2,1fr)]',
        simple: 'grid-cols-[1fr_auto]'
      }
    }
  },

  effects: {
    cardHover: 'group-hover:opacity-100 transition-opacity duration-200',
    backdropBlur: 'backdrop-blur-xl',
    gradientUnderline: 'absolute -bottom-3 left-0 w-12 h-1 bg-gradient-to-r from-primary to-primary/60 rounded-full'
  },

  // Input fields
  input: "w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 \
         focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary \
         transition-colors",
  
  inputSmall: "w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm \
              focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary \
              transition-colors",

  // Buttons
  buttonPrimary: "w-full h-12 bg-primary text-white font-medium rounded-xl \
                  hover:bg-primary/90 active:scale-[0.98] transition-all \
                  focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",

  buttonSecondary: "w-full h-12 bg-gray-50 text-gray-900 font-medium rounded-xl border border-gray-200 \
                    hover:bg-gray-100 active:scale-[0.98] transition-all \
                    focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",

  // Dropdowns
  dropdownButton: "w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-left text-gray-900 \
                   hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary \
                   transition-colors flex items-center justify-between",

  dropdownOption: "w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center justify-between \
                   focus:outline-none transition-colors",

  // Tags/Pills
  tag: "inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-sm",

  // Links
  link: "text-gray-500 hover:text-primary transition-colors",
} as const;