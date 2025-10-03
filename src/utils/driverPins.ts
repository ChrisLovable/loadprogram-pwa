// Driver PIN data - this will be stored in Supabase
export const DRIVER_PINS = {
  '2847': 'Abraham',
  '7391': 'Andile',
  '5623': 'Bongani',
  '9184': 'Booi',
  '3456': 'Brian Durh',
  '7829': 'Daniel',
  '1567': 'Dike Dillon',
  '4938': 'Frans',
  '8274': 'Jacob',
  '3651': 'Johannes 1',
  '9482': 'Johannes 2',
  '5173': 'John Mal',
  '6928': 'July',
  '1847': 'Krismis',
  '7359': 'Lottie',
  '4286': 'Lukas',
  '9514': 'Mangaliso',
  '6732': 'Oupa',
  '2895': 'Paul',
  '7461': 'Petrus',
  '3582': 'Petrus Mor',
  '9147': 'Phikile 2',
  '6273': 'Philkile 1',
  '4859': 'Phillip',
  '1726': 'Phuthumil',
  '5394': 'Sakkie',
  '8167': 'Sibabalo M',
  '2945': 'Simon',
  '6783': 'Siyanda',
  '4529': 'Thandinko:',
  '8371': 'Thando',
  '1654': 'Themba',
  '7298': 'Tolo',
  '3846': 'Unathi',
  '5917': 'Wayne Pei',
  '2463': 'Willie'
};

export const validateDriverPIN = (pin: string): string | null => {
  return DRIVER_PINS[pin as keyof typeof DRIVER_PINS] || null;
};
