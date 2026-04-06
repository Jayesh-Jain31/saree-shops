export const colorPresets = {
  green:  { primary: '#22c55e', dark: '#16a34a', darker: '#15803d', light: '#dcfce7', text: '#15803d', label: 'Green'  },
  blue:   { primary: '#3b82f6', dark: '#2563eb', darker: '#1d4ed8', light: '#dbeafe', text: '#1d4ed8', label: 'Blue'   },
  purple: { primary: '#8b5cf6', dark: '#7c3aed', darker: '#6d28d9', light: '#ede9fe', text: '#6d28d9', label: 'Purple' },
  pink:   { primary: '#ec4899', dark: '#db2777', darker: '#be185d', light: '#fce7f3', text: '#be185d', label: 'Pink'   },
  orange: { primary: '#f97316', dark: '#ea580c', darker: '#c2410c', light: '#ffedd5', text: '#c2410c', label: 'Orange' },
  teal:   { primary: '#14b8a6', dark: '#0d9488', darker: '#0f766e', light: '#ccfbf1', text: '#0f766e', label: 'Teal'   },
  red:    { primary: '#ef4444', dark: '#dc2626', darker: '#b91c1c', light: '#fee2e2', text: '#b91c1c', label: 'Red'    },
  indigo: { primary: '#6366f1', dark: '#4f46e5', darker: '#4338ca', light: '#e0e7ff', text: '#4338ca', label: 'Indigo' },
}

export function applyTheme(colorKey) {
  const theme = colorPresets[colorKey] || colorPresets.green
  const root = document.documentElement
  root.style.setProperty('--primary',        theme.primary)
  root.style.setProperty('--primary-dark',   theme.dark)
  root.style.setProperty('--primary-darker', theme.darker)
  root.style.setProperty('--primary-light',  theme.light)
  root.style.setProperty('--primary-text',   theme.text)
}
