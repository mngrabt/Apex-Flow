// Common styling constants
export const commonStyles = {
  // Card styles
  card: 'bg-white rounded-xl p-6 border border-gray-100',
  cardHover: 'hover:bg-gray-50 transition-colors',
  
  // Text styles
  heading: 'text-xl font-bold text-gray-900',
  subheading: 'text-lg font-bold text-gray-900',
  body: 'text-sm text-gray-600',
  label: 'text-xs font-semibold text-gray-500',
  value: 'text-sm font-medium text-gray-900',
  
  // Info block styles
  infoBlock: 'bg-gray-50 rounded-xl p-6',
  infoBlockLabel: 'text-xs font-semibold text-gray-500 mb-1',
  infoBlockValue: 'text-sm font-medium text-gray-900',
  
  // Grid layouts
  grid: {
    cols2: 'grid grid-cols-2 gap-6',
    cols3: 'grid grid-cols-3 gap-6',
    cols4: 'grid grid-cols-4 gap-6',
    autoFit: 'grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6'
  },
  
  // Button styles
  button: {
    primary: 'px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors',
    secondary: 'px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors'
  },
  
  // Action buttons
  actionButton: {
    base: 'p-2 rounded-xl transition-colors',
    edit: 'bg-gray-100 text-gray-500 hover:text-primary hover:bg-primary/10',
    delete: 'bg-red-50 text-red-500 hover:bg-red-100',
    download: 'bg-gray-50 text-gray-400 hover:text-primary hover:bg-gray-100'
  },
  
  // Status indicators
  status: {
    dot: 'h-2 w-2 rounded-full',
    active: 'bg-primary',
    inactive: 'border border-gray-300'
  },
  
  // Layout
  container: 'max-w-6xl mx-auto space-y-8',
  header: 'flex items-center justify-between mb-8',
  backButton: 'flex items-center text-gray-400 hover:text-primary transition-colors',
  
  // Signatures section
  signatures: {
    container: 'bg-gray-50 rounded-xl p-6',
    grid: 'grid grid-cols-4 gap-6',
    item: 'bg-white rounded-xl p-6 flex items-center justify-between'
  },

  // Document section
  document: {
    button: 'bg-gray-50 rounded-xl p-6 text-left hover:bg-gray-100 transition-colors group',
    icon: 'h-5 w-5 text-gray-400 group-hover:text-primary',
    title: 'text-xs font-semibold text-gray-500 group-hover:text-primary mb-1',
    action: 'text-sm font-medium text-gray-900 group-hover:text-primary'
  },

  // List styles
  list: {
    container: 'space-y-6',
    item: 'bg-white rounded-xl p-6 border border-gray-100 hover:bg-gray-50 transition-colors',
    header: 'flex items-center justify-between mb-6',
    title: 'text-xl font-bold text-gray-900',
    description: 'text-sm text-gray-600 mt-1',
    infoGrid: 'grid grid-cols-4 gap-6 mb-6',
    actions: 'flex items-center space-x-6'
  },

  // Form styles
  form: {
    group: 'space-y-6',
    label: 'block text-xs font-semibold text-gray-500 mb-1',
    input: 'w-full px-6 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary/10 focus:border-primary transition-shadow',
    select: 'w-full px-6 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900',
    textarea: 'w-full px-6 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 resize-none',
    error: 'text-sm text-red-600 mt-1',
    actions: 'flex justify-end space-x-6 pt-6'
  }
};