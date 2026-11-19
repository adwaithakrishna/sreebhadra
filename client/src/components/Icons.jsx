const base = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: false };
const make = (children) =>
  function Icon({ size = 20, className = '' }) {
    return (
      <svg {...base} width={size} height={size} className={className}>
        {children}
      </svg>
    );
  };

export const IconUsers = make(<><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5" /><path d="M16 5.2a3.2 3.2 0 0 1 0 5.9M18 14.8c2 .6 3.2 2.3 3.5 5.2" /></>);
export const IconBag = make(<><rect x="4" y="7" width="16" height="13" rx="2.5" /><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" /></>);
export const IconCheck = make(<path d="m5 12.5 4.5 4.5L19 7.5" />);
export const IconArrow = make(<path d="M5 12h14m-5-5 5 5-5 5" />);
export const IconPhone = make(<path d="M5 4h3.5l1.7 4.3-2 1.3a11 11 0 0 0 5.2 5.2l1.3-2 4.3 1.7V18a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z" />);
export const IconMail = make(<><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m4 7 8 6 8-6" /></>);
export const IconPin = make(<><path d="M12 21s7-6.2 7-11.2A7 7 0 0 0 5 9.8C5 14.8 12 21 12 21Z" /><circle cx="12" cy="9.8" r="2.4" /></>);
export const IconShield = make(<><path d="M12 3 4.5 6v5.5c0 4.4 3 7.9 7.5 9.5 4.5-1.6 7.5-5.100 7.5-9.500V6L12 3Z" /><path d="m8.800 12 2.400 2.400 4-4.600" /></>);
export const IconClock = make(<><circle cx="12" cy="12" r="8.500" /><path d="M12 7.500V12l3 2" /></>);
export const IconStar = make(<path d="m12 3.500 2.600 5.400 5.900.8-4.300 4.100 1 5.800L12 16.800 6.800 19.600l1-5.800L3.500 9.700l5.900-.8L12 3.500Z" />);
export const IconMenu = make(<path d="M4 7h16M4 12h16M4 17h16" />);
export const IconX = make(<path d="m6 6 12 12M18 6 6 18" />);
export const IconPlus = make(<path d="M12 5v14M5 12h14" />);
export const IconTrash = make(<><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 12.500a1.500 1.500 0 0 0 1.500 1.500h7a1.500 1.500 0 0 0 1.500-1.500L18 7M9 7V4.500h6V7" /></>);
export const IconCalendar = make(<><rect x="3.500" y="5" width="17" height="15" rx="2.500" /><path d="M3.500 10h17M8 3v4M16 3v4" /></>);
export const IconUpload = make(<path d="M12 16V5m0 0L7.500 9.500M12 5l4.500 4.500M5 19h14" />);
export const IconChevronLeft = make(<path d="m14.500 6-6 6 6 6" />);
export const IconChevronRight = make(<path d="m9.500 6 6 6-6 6" />);
export const IconRoute = make(<><circle cx="6" cy="18" r="2.200" /><circle cx="18" cy="6" r="2.200" /><path d="M8.200 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.800" /></>);
export const IconAlert = make(<><path d="M12 3.500 2.500 20h19L12 3.500Z" /><path d="M12 10v4.500M12 17.500v.1" /></>);
export const IconGrid = make(<><rect x="4" y="4" width="6.500" height="6.500" rx="1.500" /><rect x="13.500" y="4" width="6.500" height="6.500" rx="1.500" /><rect x="4" y="13.500" width="6.500" height="6.500" rx="1.500" /><rect x="13.500" y="13.500" width="6.500" height="6.500" rx="1.500" /></>);
export const IconList = make(<path d="M8 6h12M8 12h12M8 18h12M4 6h.1M4 12h.1M4 18h.1" />);
export const IconCar = make(<><path d="M4 15.500V12l2-5h12l2 5v3.500M4 15.500h16M4 15.500V18M20 15.500V18" /><circle cx="7.500" cy="15.500" r="1" /><circle cx="16.500" cy="15.500" r="1" /></>);
export const IconLogout = make(<path d="M10 4H6.500A1.500 1.500 0 0 0 5 5.500v13A1.500 1.500 0 0 0 6.500 20H10M15 8l4 4-4 4M19 12H9.500" />);
