# Promkes poster illustration redesign

Approved scope: the home page and all ten existing topics; white background, magenta brand, pink/purple/orange/blue categories. Large original illustrations and meaningful icons; all clinical text, numbers, sources and warnings remain complete. Preserve hash URLs, PWA/offline behavior and navigation.

Deliverables: responsive static site; ten locally stored poster illustrations; editable Figma home, nutrition and pregnancy-danger layouts in mobile and desktop sizes, with reusable components; GitHub Pages deployment and browser verification.

Implementation: update from origin/main; shared artwork metadata; visual renderer and content hydration; CSS; versioned service worker. No public API or medical advice changes. Test 320/390/768/1440 widths, all topic bodies and image loading, keyboard navigation, offline loading and prior cache activation.

Deployment: push the validated implementation to main, wait for Pages deployment, inspect the live version and the affected UI. Diagnose the existing custom-domain certificate issue through the existing GitHub Pages configuration if still present.

Additional user requirement: include Gambiran and SisiWanita logos in the site and Figma; edit the supplied SisiWanita mark to add sisiwanita.id below its existing script without changing its lettering or color.
