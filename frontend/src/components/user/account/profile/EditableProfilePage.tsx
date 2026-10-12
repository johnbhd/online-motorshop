"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClipboardList,
  faCircleUser,
  faEnvelope,
  faLocationDot,
  faLock,
  faPhone,
  faRotate,
  faShieldHalved,
  faUser,
} from "@fortawesome/free-solid-svg-icons";

import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { getAuthToken } from "@/lib/auth/authStorage";
import type { AuthUser } from "@/lib/auth/authTypes";
import {
  getCustomerProfile,
  getCustomerProfileErrorMessage,
  getCustomerProfileValidationErrors,
  updateCustomerPassword,
  updateCustomerProfile,
} from "@/lib/customerProfileApi";
import {
  getBarangaysForCity,
  getCitiesMunicipalities,
  getLocationErrorMessage,
} from "@/lib/locationApi";
import type {
  LocationDetectionState,
  LocationOption,
  ReverseGeocodeResponse,
} from "@/lib/locationTypes";
import { locationNamesMatch } from "@/lib/locationTypes";
import ProfileAddressFields, { type ProfileLocationValues } from "./ProfileAddressFields";
import CustomerLocationPicker from "./CustomerLocationPicker";

type ProfileForm = {
  name: string;
  email: string;
  contact_number: string;
  address: string;
};

type PasswordForm = {
  current_password: string;
  password: string;
  password_confirmation: string;
};

type FieldErrors = Record<string, string[]>;

const EMPTY_PASSWORD: PasswordForm = {
  current_password: "",
  password: "",
  password_confirmation: "",
};

const EMPTY_LOCATION: ProfileLocationValues = {
  cityCode: "",
  cityName: "",
  barangayCode: "",
  barangayName: "",
};

type ProfileCoordinates = {
  latitude: number | null;
  longitude: number | null;
};

const EMPTY_COORDINATES: ProfileCoordinates = {
  latitude: null,
  longitude: null,
};

function profileFormFromUser(user: AuthUser): ProfileForm {
  return {
    name: user.name,
    email: user.email,
    contact_number: user.customer?.contact_number ?? "",
    address: user.customer?.address ?? "",
  };
}

function profileLocationFromUser(user: AuthUser, fallback = EMPTY_LOCATION): ProfileLocationValues {
  const cityCode = user.customer?.city_municipality_code === undefined
    ? fallback.cityCode
    : user.customer.city_municipality_code ?? "";
  const cityName = user.customer?.city === undefined ? fallback.cityName : user.customer.city ?? "";
  const barangayCode = user.customer?.barangay_code === undefined
    ? fallback.barangayCode
    : user.customer.barangay_code ?? "";
  const barangayName = user.customer?.barangay === undefined
    ? fallback.barangayName
    : user.customer.barangay ?? "";

  return {
    cityCode,
    cityName,
    barangayCode: cityCode ? barangayCode : "",
    barangayName: cityCode || cityName ? barangayName : "",
  };
}

function coordinateFromValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function profileCoordinatesFromUser(user: AuthUser, fallback = EMPTY_COORDINATES): ProfileCoordinates {
  const latitude = user.customer?.latitude === undefined
    ? fallback.latitude
    : coordinateFromValue(user.customer.latitude);
  const longitude = user.customer?.longitude === undefined
    ? fallback.longitude
    : coordinateFromValue(user.customer.longitude);

  return {
    latitude: latitude !== null && longitude !== null ? latitude : null,
    longitude: latitude !== null && longitude !== null ? longitude : null,
  };
}

export default function EditableProfilePage() {
  const { isLoading: authLoading, user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [values, setValues] = useState<ProfileForm>({
    name: "",
    email: "",
    contact_number: "",
    address: "",
  });
  const [location, setLocation] = useState<ProfileLocationValues>(EMPTY_LOCATION);
  const [coordinates, setCoordinates] = useState<ProfileCoordinates>(EMPTY_COORDINATES);
  const [locationDetectionState, setLocationDetectionState] = useState<LocationDetectionState>("idle");
  const [password, setPassword] = useState<PasswordForm>(EMPTY_PASSWORD);
  const [profileErrors, setProfileErrors] = useState<FieldErrors>({});
  const [passwordErrors, setPasswordErrors] = useState<FieldErrors>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cityOptions, setCityOptions] = useState<readonly LocationOption[]>([]);
  const [barangayOptions, setBarangayOptions] = useState<readonly LocationOption[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [barangayLoading, setBarangayLoading] = useState(false);
  const [cityLoadError, setCityLoadError] = useState<string | null>(null);
  const [barangayLoadError, setBarangayLoadError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const barangayRequestId = useRef(0);

  const loadProfile = useCallback((signal?: AbortSignal) => {
    const token = getAuthToken();

    if (!token) {
      if (!signal?.aborted) {
        setLoadError("Your customer session is unavailable. Please sign in again.");
        setLoading(false);
      }
      return Promise.resolve();
    }

    return getCustomerProfile(token, signal)
      .then((response) => {
        if (!signal?.aborted) {
          setProfile(response.user);
          setValues(profileFormFromUser(response.user));
          setLocation(profileLocationFromUser(response.user));
          setCoordinates(profileCoordinatesFromUser(response.user));
          setLocationDetectionState("idle");
          setLoadError(null);
        }
      })
      .catch((error: unknown) => {
        if (!signal?.aborted) {
          setLoadError(getCustomerProfileErrorMessage(error, "Unable to load your profile. Please try again."));
        }
      })
      .finally(() => {
        if (!signal?.aborted) setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();

    queueMicrotask(() => {
      if (!controller.signal.aborted) void loadProfile(controller.signal);
    });

    return () => controller.abort();
  }, [user, loadProfile]);

  const loadCities = useCallback((signal?: AbortSignal) => {
    setCityLoading(true);
    setCityLoadError(null);

    return getCitiesMunicipalities(signal)
      .then((options) => {
        if (!signal?.aborted) setCityOptions(options);
      })
      .catch((error: unknown) => {
        if (!signal?.aborted) setCityLoadError(getLocationErrorMessage(error));
      })
      .finally(() => {
        if (!signal?.aborted) setCityLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();

    queueMicrotask(() => {
      if (!controller.signal.aborted) void loadCities(controller.signal);
    });

    return () => controller.abort();
  }, [user, loadCities]);

  const loadBarangays = useCallback((cityCode: string, signal?: AbortSignal) => {
    const requestId = barangayRequestId.current + 1;
    barangayRequestId.current = requestId;

    if (!cityCode) {
      setBarangayOptions([]);
      setBarangayLoadError(null);
      setBarangayLoading(false);
      return Promise.resolve();
    }

    setBarangayLoading(true);
    setBarangayLoadError(null);
    setBarangayOptions([]);

    return getBarangaysForCity(cityCode, signal)
      .then((options) => {
        if (!signal?.aborted && requestId === barangayRequestId.current) {
          setBarangayOptions(options);
        }
      })
      .catch((error: unknown) => {
        if (!signal?.aborted && requestId === barangayRequestId.current) {
          setBarangayLoadError(getLocationErrorMessage(error));
        }
      })
      .finally(() => {
        if (!signal?.aborted && requestId === barangayRequestId.current) {
          setBarangayLoading(false);
        }
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    queueMicrotask(() => {
      if (!controller.signal.aborted) void loadBarangays(location.cityCode, controller.signal);
    });

    return () => controller.abort();
  }, [location.cityCode, loadBarangays]);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextValues = {
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      contact_number: values.contact_number.trim(),
      address: values.address.trim(),
    };
    const errors: FieldErrors = {};

    if (!nextValues.name) errors.name = ["Enter your full name."];
    else if (nextValues.name.length > 255) errors.name = ["Use 255 characters or fewer."];
    if (!nextValues.email) errors.email = ["Enter your email address."];
    else if (!/^\S+@\S+\.\S+$/.test(nextValues.email)) errors.email = ["Enter a valid email address."];
    if (!nextValues.contact_number) errors.contact_number = ["Enter your contact number."];
    else if (nextValues.contact_number.length > 30) errors.contact_number = ["Use 30 characters or fewer."];
    if (nextValues.address.length > 255) errors.address = ["Use 255 characters or fewer."];
    const hasCity = Boolean(location.cityName.trim());
    const hasBarangay = Boolean(location.barangayName.trim());

    if (hasCity && !hasBarangay) errors.barangay = ["Enter a barangay."];
    if (!hasCity && hasBarangay) errors.city_municipality = ["Enter a city or municipality first."];
    if (location.barangayCode && !location.cityCode) {
      errors.city_municipality_code = ["Choose an official city or municipality before selecting a PSGC barangay."];
    }
    if (
      coordinates.latitude !== null
      && coordinates.longitude !== null
      && locationDetectionState === "mismatch"
    ) {
      errors.location = ["Use the map again or update the city and barangay so they match the pinned location."];
    }

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setProfileError("Your customer session is unavailable. Please sign in again.");
      return;
    }

    setSavingProfile(true);
    setProfileError(null);
    setProfileErrors({});

    try {
      const locationPayload = {
        city_municipality: location.cityName.trim() || null,
        barangay: location.barangayName.trim() || null,
        city_municipality_code: location.cityCode || null,
        barangay_code: location.barangayCode || null,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      };
      const response = await updateCustomerProfile(token, { ...nextValues, ...locationPayload });
      setProfile(response.user);
      setValues(profileFormFromUser(response.user));
      setLocation(profileLocationFromUser(response.user, location));
      setCoordinates(profileCoordinatesFromUser(response.user, coordinates));
      setLocationDetectionState("idle");
      updateUser({ name: response.user.name, email: response.user.email, customer: response.user.customer });
      showToast({ title: "Profile updated", message: "Your customer account details have been saved." });
    } catch (error) {
      setProfileError(getCustomerProfileErrorMessage(error));
      setProfileErrors(getCustomerProfileValidationErrors(error));
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors: FieldErrors = {};
    if (!password.current_password) errors.current_password = ["Enter your current password."];
    if (password.password.length < 8) errors.password = ["Use at least 8 characters."];
    if (password.password_confirmation !== password.password) errors.password_confirmation = ["The password confirmation does not match."];

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setPasswordError("Your customer session is unavailable. Please sign in again.");
      return;
    }

    setSavingPassword(true);
    setPasswordError(null);
    setPasswordErrors({});

    try {
      const response = await updateCustomerPassword(token, password);
      setPassword(EMPTY_PASSWORD);
      showToast({ title: "Password updated", message: response.message });
    } catch (error) {
      setPasswordError(getCustomerProfileErrorMessage(error));
      setPasswordErrors(getCustomerProfileValidationErrors(error));
    } finally {
      setSavingPassword(false);
    }
  };

  if (authLoading || !user || loading) {
    return <div className="customer-profile-page"><div className="customer-profile-loading" aria-live="polite">Loading your profile…</div></div>;
  }

  if (loadError || !profile) {
    return (
      <div className="customer-profile-page">
        <section className="customer-profile-error" role="alert">
          <p className="customer-orders-eyebrow">Customer Account</p>
          <h1>Unable to load your profile</h1>
          <p>{loadError ?? "The profile response was not available."}</p>
          <button type="button" className="customer-profile-action customer-profile-action--primary" onClick={() => { setLoading(true); setLoadError(null); void loadProfile(); }}>
            <FontAwesomeIcon icon={faRotate} aria-hidden="true" /> Try again
          </button>
        </section>
      </div>
    );
  }

  const savedLocation = profileLocationFromUser(profile);
  const savedCoordinates = profileCoordinatesFromUser(profile);
  const isProfileDirty = values.name !== profile.name
    || values.email !== profile.email
    || values.contact_number !== (profile.customer?.contact_number ?? "")
    || values.address !== (profile.customer?.address ?? "")
    || location.cityCode !== savedLocation.cityCode
    || location.cityName !== savedLocation.cityName
    || location.barangayCode !== savedLocation.barangayCode
    || location.barangayName !== savedLocation.barangayName
    || coordinates.latitude !== savedCoordinates.latitude
    || coordinates.longitude !== savedCoordinates.longitude;

  return (
    <div className="customer-profile-page">
      <section className="customer-orders-hero" aria-labelledby="customer-profile-page-title">
        <div className="customer-orders-shell">
          <p className="customer-orders-eyebrow">Customer Account</p>
          <h1 id="customer-profile-page-title">Profile</h1>
          <p>Update the account details and password you use with ALD Motorshop.</p>
        </div>
      </section>

      <div className="customer-orders-shell customer-profile-content">
        <main className="customer-profile-main">
          <section className="customer-profile-card" aria-labelledby="profile-details-title">
            <div className="customer-profile-card-header">
              <span className="customer-profile-avatar" aria-hidden="true"><FontAwesomeIcon icon={faCircleUser} /></span>
              <div>
                <p className="customer-orders-eyebrow">Signed-in customer</p>
                <h2 id="profile-details-title">{profile.name}</h2>
                <p>Keep your contact details current for order updates.</p>
              </div>
            </div>

            <form className="customer-profile-form" onSubmit={saveProfile} noValidate>
              <ProfileSectionHeader icon={faUser} title="Personal details" description="These details are used for your account and order communication." />
              <div className="customer-profile-form-grid">
                <ProfileField id="customer-profile-name" label="Full name" icon={faUser} value={values.name} error={profileErrors.name?.[0]} autoComplete="name" onChange={(name) => setValues((current) => ({ ...current, name }))} />
                <ProfileField id="customer-profile-email" label="Email address" icon={faEnvelope} type="email" value={values.email} error={profileErrors.email?.[0]} autoComplete="email" onChange={(email) => setValues((current) => ({ ...current, email }))} />
                <ProfileField id="customer-profile-contact-number" label="Contact number" icon={faPhone} type="tel" value={values.contact_number} error={profileErrors.contact_number?.[0]} autoComplete="tel" onChange={(contact_number) => setValues((current) => ({ ...current, contact_number }))} />
              </div>
              <ProfileSectionHeader icon={faLocationDot} title="Address & location" description="Keep your complete address together with your PSGC city and barangay selection." />
              <div className="customer-profile-form-grid customer-profile-address-grid">
                <ProfileField id="customer-profile-address" label="Address" icon={faLocationDot} value={values.address} error={profileErrors.address?.[0]} autoComplete="street-address" multiline onChange={(address) => setValues((current) => ({ ...current, address }))} />
                <ProfileAddressFields
                  cityCode={location.cityCode}
                  cityName={location.cityName}
                  barangayCode={location.barangayCode}
                  barangayName={location.barangayName}
                  cityOptions={cityOptions}
                  barangayOptions={barangayOptions}
                  cityLoading={cityLoading}
                  barangayLoading={barangayLoading}
                  cityError={cityLoadError ?? profileErrors.city_municipality?.[0] ?? profileErrors.city_municipality_code?.[0]}
                  barangayError={barangayLoadError ?? profileErrors.barangay?.[0] ?? profileErrors.barangay_code?.[0]}
                  onCityRetry={cityLoadError ? () => void loadCities() : undefined}
                  onBarangayRetry={barangayLoadError ? () => void loadBarangays(location.cityCode) : undefined}
                  onCityChange={(selection) => {
                    if (coordinates.latitude !== null && coordinates.longitude !== null) {
                      setLocationDetectionState("mismatch");
                    }
                    setLocation({
                      cityCode: selection.code ?? "",
                      cityName: selection.label,
                      barangayCode: "",
                      barangayName: "",
                    });
                  }}
                  onBarangayChange={(selection) => {
                    if (coordinates.latitude !== null && coordinates.longitude !== null) {
                      setLocationDetectionState("mismatch");
                    }
                    setLocation((current) => ({
                      ...current,
                      barangayCode: selection.code ?? "",
                      barangayName: selection.label,
                    }));
                  }}
                />
              </div>
              <CustomerLocationPicker
                latitude={coordinates.latitude}
                longitude={coordinates.longitude}
                detectionState={locationDetectionState}
                onChange={(latitude, longitude) => {
                  setCoordinates({ latitude, longitude });
                  if (latitude === null || longitude === null) {
                    setLocationDetectionState("idle");
                  }
                }}
                onDetected={(result: ReverseGeocodeResponse) => {
                  setLocation((current) => {
                    const cityName = result.psgc.city_municipality
                      ?? result.detected.city_municipality
                      ?? current.cityName;
                    const cityCode = result.psgc.city_municipality_code ?? "";
                    const cityChanged = (
                      (current.cityName.trim() !== ""
                        && cityName.trim() !== ""
                        && !locationNamesMatch(current.cityName, cityName))
                      || (current.cityCode !== ""
                        && current.cityCode !== cityCode)
                    );
                    const barangayMatched = result.psgc.barangay !== null;

                    return {
                      cityCode,
                      cityName,
                      barangayCode: barangayMatched
                        ? result.psgc.barangay_code ?? ""
                        : cityChanged
                          ? ""
                          : current.barangayCode,
                      barangayName: barangayMatched
                        ? result.psgc.barangay
                          ?? result.detected.barangay
                          ?? ""
                        : cityChanged
                          ? ""
                          : current.barangayName,
                    };
                  });
                }}
                onDetectionStateChange={setLocationDetectionState}
              />
              {profileErrors.location?.[0] ? <p className="customer-profile-form-error" role="alert">{profileErrors.location[0]}</p> : null}
              {profileError ? <p className="customer-profile-form-error" role="alert">{profileError}</p> : null}
              <div className="customer-profile-form-footer"><button type="submit" className="customer-profile-action customer-profile-action--primary" disabled={savingProfile || !isProfileDirty}>{savingProfile ? "Saving…" : "Save changes"}</button></div>
            </form>
          </section>

          <form className="customer-profile-card customer-profile-form" onSubmit={savePassword} noValidate>
            <ProfileSectionHeader icon={faLock} title="Change password" description="Confirm your current password before choosing a new one." />
            <div className="customer-profile-form-grid">
              <ProfileField id="customer-current-password" label="Current password" icon={faLock} type="password" value={password.current_password} error={passwordErrors.current_password?.[0]} autoComplete="current-password" onChange={(current_password) => setPassword((current) => ({ ...current, current_password }))} />
              <ProfileField id="customer-new-password" label="New password" icon={faLock} type="password" value={password.password} error={passwordErrors.password?.[0]} autoComplete="new-password" onChange={(passwordValue) => setPassword((current) => ({ ...current, password: passwordValue }))} />
              <ProfileField id="customer-confirm-password" label="Confirm new password" icon={faLock} type="password" value={password.password_confirmation} error={passwordErrors.password_confirmation?.[0]} autoComplete="new-password" onChange={(password_confirmation) => setPassword((current) => ({ ...current, password_confirmation }))} />
            </div>
            {passwordError ? <p className="customer-profile-form-error" role="alert">{passwordError}</p> : null}
            <div className="customer-profile-form-footer"><button type="submit" className="customer-profile-action customer-profile-action--secondary" disabled={savingPassword}>{savingPassword ? "Updating…" : "Update password"}</button></div>
          </form>
        </main>

        <aside className="customer-profile-aside" aria-labelledby="profile-actions-title">
          <div className="customer-profile-aside-heading"><FontAwesomeIcon icon={faShieldHalved} aria-hidden="true" /><h2 id="profile-actions-title">Account shortcuts</h2></div>
          <p>Continue browsing your requests or use the public tracking page to check an order reference.</p>
          <div className="customer-profile-links">
            <Link className="customer-profile-link" href="/account/orders"><FontAwesomeIcon icon={faClipboardList} aria-hidden="true" /> My Orders</Link>
            <Link className="customer-profile-link" href="/track-order"><FontAwesomeIcon icon={faClipboardList} aria-hidden="true" /> Track Order</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ProfileSectionHeader({ icon, title, description }: { icon: typeof faUser; title: string; description: string }) {
  return <div className="customer-profile-section-heading"><span className="customer-profile-section-icon"><FontAwesomeIcon icon={icon} aria-hidden="true" /></span><div><h2>{title}</h2><p>{description}</p></div></div>;
}

function ProfileField({ id, label, icon, value, error, type = "text", autoComplete, multiline = false, onChange }: { id: string; label: string; icon: typeof faUser; value: string; error?: string; type?: string; autoComplete?: string; multiline?: boolean; onChange: (value: string) => void }) {
  const errorId = `${id}-error`;
  const fieldProps = {
    id,
    value,
    autoComplete,
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? errorId : undefined,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value),
  };

  return <div className="customer-profile-field"><label htmlFor={id}><FontAwesomeIcon icon={icon} aria-hidden="true" />{label}</label>{multiline ? <textarea {...fieldProps} rows={3} /> : <input {...fieldProps} type={type} />}{error ? <p id={errorId} className="customer-profile-field-error" role="alert">{error}</p> : null}</div>;
}
