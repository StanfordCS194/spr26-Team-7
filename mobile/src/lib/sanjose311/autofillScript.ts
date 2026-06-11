import { Sj311FormPayload } from './types'

const escapeForScript = (value: string) =>
  JSON.stringify(value).replace(/</g, '\\u003c')

export const buildSj311AutofillScript = (payload: Sj311FormPayload): string => {
  const payloadJson = escapeForScript(JSON.stringify(payload))

  return `
(function () {
  const payload = JSON.parse(${payloadJson});
  const filled = [];
  const errors = [];

  const post = (type, extra) => {
    if (!window.ReactNativeWebView) return;
    window.ReactNativeWebView.postMessage(JSON.stringify({ type, ...extra }));
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const normalize = (value) => String(value || '').trim().toLowerCase();

  const setNativeValue = (el, value) => {
    if (!el || value == null || value === '') return false;
    const tag = el.tagName;
    const prototype =
      tag === 'TEXTAREA'
        ? HTMLTextAreaElement.prototype
        : tag === 'SELECT'
          ? HTMLSelectElement.prototype
          : HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
    if (descriptor && descriptor.set) {
      descriptor.set.call(el, value);
    } else {
      el.value = value;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  };

  const clickElement = (el) => {
    if (!el) return false;
    el.click();
    return true;
  };

  const textIncludes = (haystack, needles) => {
    const text = normalize(haystack);
    return needles.some((needle) => text.includes(normalize(needle)));
  };

  const findClickableByText = (needles) => {
    const candidates = Array.from(
      document.querySelectorAll('button, a, [role="button"], label, div, span, li')
    );
    for (const el of candidates) {
      const text = normalize(el.textContent || el.getAttribute('aria-label') || '');
      if (!text) continue;
      if (needles.some((needle) => text.includes(normalize(needle)))) {
        return el;
      }
    }
    return null;
  };

  const findField = (hints) => {
    const selectors = [
      'textarea',
      'input[type="text"]',
      'input[type="email"]',
      'input[type="tel"]',
      'input[type="search"]',
      'input:not([type])',
      'select',
    ];

    for (const hint of hints) {
      const byLabel = Array.from(document.querySelectorAll('label')).find((label) =>
        normalize(label.textContent || '').includes(normalize(hint))
      );
      if (byLabel) {
        const forId = byLabel.getAttribute('for');
        if (forId) {
          const linked = document.getElementById(forId);
          if (linked) return linked;
        }
        const nested = byLabel.querySelector('textarea, input, select');
        if (nested) return nested;
      }
    }

    for (const selector of selectors) {
      for (const el of Array.from(document.querySelectorAll(selector))) {
        const attrs = [
          el.getAttribute('name'),
          el.getAttribute('id'),
          el.getAttribute('placeholder'),
          el.getAttribute('aria-label'),
        ]
          .filter(Boolean)
          .join(' ');
        if (textIncludes(attrs, hints)) {
          return el;
        }
      }
    }

    return null;
  };

  const chooseOption = (hints, value) => {
    if (!value) return false;
    const select = findField(hints);
    if (select && select.tagName === 'SELECT') {
      const options = Array.from(select.options || []);
      const match = options.find((option) =>
        normalize(option.textContent || '').includes(normalize(value))
      );
      if (match) {
        setNativeValue(select, match.value);
        filled.push('select:' + value);
        return true;
      }
    }

    const radio = Array.from(document.querySelectorAll('input[type="radio"], [role="radio"]')).find(
      (el) => normalize(el.getAttribute('value') || el.textContent || '').includes(normalize(value))
    );
    if (radio) {
      clickElement(radio);
      filled.push('radio:' + value);
      return true;
    }

    const optionButton = findClickableByText([value]);
    if (optionButton) {
      clickElement(optionButton);
      filled.push('option:' + value);
      return true;
    }

    return false;
  };

  const fillField = (hints, value, label) => {
    if (!value) return false;
    const field = findField(hints);
    if (!field) return false;
    if (setNativeValue(field, value)) {
      filled.push(label);
      return true;
    }
    return false;
  };

  const trySelectService = async () => {
    const serviceNeedles = [
      payload.portalLabel,
      payload.tag,
      payload.category,
      ...(payload.searchTerms || []),
    ].filter(Boolean);

    for (const needle of serviceNeedles) {
      const match = findClickableByText([needle]);
      if (match) {
        clickElement(match);
        filled.push('service:' + needle);
        await sleep(900);
        return true;
      }
    }
    return false;
  };

  const tryGuestSubmit = async () => {
    const guest = findClickableByText(['submit as guest', 'continue as guest', 'guest']);
    if (guest) {
      clickElement(guest);
      filled.push('guest');
      await sleep(700);
      return true;
    }
    return false;
  };

  const tryFillLocation = () => {
    const locationValue = payload.fullAddress || payload.locationMain;
    if (!locationValue) return false;

    const filledAddress = fillField(payload.fieldHints?.location || [], locationValue, 'location');
    if (filledAddress) return true;

    const searchInput = findField(['search', 'address', 'location']);
    if (searchInput && setNativeValue(searchInput, locationValue)) {
      filled.push('location-search');
      searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      return true;
    }

    return false;
  };

  const tryFillCoordinates = () => {
    if (payload.latitude == null || payload.longitude == null) return false;

    const latField = findField(['lat', 'latitude']);
    const lonField = findField(['lng', 'lon', 'longitude']);
    let didFill = false;

    if (latField && setNativeValue(latField, String(payload.latitude))) {
      filled.push('latitude');
      didFill = true;
    }
    if (lonField && setNativeValue(lonField, String(payload.longitude))) {
      filled.push('longitude');
      didFill = true;
    }

    if (window.map && typeof window.map.setView === 'function') {
      try {
        window.map.setView([payload.latitude, payload.longitude], 18);
        filled.push('map:setView');
        didFill = true;
      } catch (err) {
        errors.push('map:setView');
      }
    }

    return didFill;
  };

  const runAutofill = async () => {
    post('autofill_started', { portalLabel: payload.portalLabel });

    await sleep(1200);
    await trySelectService();
    await sleep(800);
    await tryGuestSubmit();
    await sleep(800);

    fillField(payload.fieldHints?.description || [], payload.description, 'description');
    tryFillLocation();
    tryFillCoordinates();

    if (payload.reporter?.email) {
      fillField(payload.fieldHints?.email || [], payload.reporter.email, 'email');
    }
    if (payload.reporter?.firstName) {
      fillField(payload.fieldHints?.firstName || [], payload.reporter.firstName, 'firstName');
    }
    if (payload.reporter?.lastName) {
      fillField(payload.fieldHints?.lastName || [], payload.reporter.lastName, 'lastName');
    }
    if (payload.reporter?.phone) {
      fillField(payload.fieldHints?.phone || [], payload.reporter.phone, 'phone');
    }

    if (payload.graffitiSurface) {
      chooseOption(payload.fieldHints?.graffitiSurface || [], payload.graffitiSurface);
    }
    if (payload.vehicleConcern) {
      chooseOption(payload.fieldHints?.vehicleConcern || [], payload.vehicleConcern);
    }

    post('autofill_complete', {
      filled,
      errors,
      photoNote: payload.photoNote,
      needsPhoto: true,
    });
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    runAutofill().catch((err) => post('autofill_error', { message: String(err) }));
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      runAutofill().catch((err) => post('autofill_error', { message: String(err) }));
    });
  }
})();
true;
`
}
