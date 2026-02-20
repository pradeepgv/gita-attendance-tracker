import { useState, useEffect, useRef } from 'react';
import { searchFamilies, submitAttendance } from '../utils/api';

function AttendancePage() {
  const [formData, setFormData] = useState({
    family_name: '',
    mobile: '',
    adults_count: 1,
    children_count: 0,
  });
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [errors, setErrors] = useState({});
  const suggestionsRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleNameChange(e) {
    const value = e.target.value;
    setFormData({ ...formData, family_name: value });
    setSelectedFamily(null);

    if (value.length >= 1) {
      try {
        const results = await searchFamilies(value);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch {
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }

  function selectFamily(family) {
    setSelectedFamily(family);
    setFormData({
      ...formData,
      family_name: family.name,
      mobile: family.mobile || '',
    });
    setShowSuggestions(false);
  }

  function validate() {
    const errs = {};
    if (!formData.family_name.trim()) errs.family_name = 'Family name is required';
    if (formData.mobile && !/^[+]?[\d\s-]{10,15}$/.test(formData.mobile)) {
      errs.mobile = 'Invalid mobile number (10-15 digits)';
    }
    if (formData.adults_count < 0) errs.adults_count = 'Cannot be negative';
    if (formData.children_count < 0) errs.children_count = 'Cannot be negative';
    if (formData.adults_count === 0 && formData.children_count === 0) {
      errs.adults_count = 'At least one person must attend';
    }
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);

    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      await submitAttendance(formData);
      setMessage({ type: 'success', text: 'Attendance recorded successfully! Hare Krishna!' });
      setFormData({ family_name: '', mobile: '', adults_count: 1, children_count: 0 });
      setSelectedFamily(null);
    } catch (err) {
      if (err.status === 409) {
        setMessage({ type: 'warning', text: 'Attendance already submitted today for this family.' });
      } else {
        setMessage({ type: 'error', text: err.message || 'Failed to submit attendance' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Mark Attendance - One per family</h2>
          <p className="text-gray-500 mt-1">Bhagavad Gita Weekly Class</p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : message.type === 'warning'
                  ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Family Name with Autocomplete */}
          <div className="relative" ref={suggestionsRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Family Name <span className="text-red-500">*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              value={formData.family_name}
              onChange={handleNameChange}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Start typing family name..."
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-saffron-500 focus:border-saffron-500 outline-none transition ${
                errors.family_name ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.family_name && (
              <p className="text-red-500 text-xs mt-1">{errors.family_name}</p>
            )}
            {showSuggestions && (
              <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-48 overflow-y-auto">
                {suggestions.map((family) => (
                  <li
                    key={family.id}
                    onClick={() => selectFamily(family)}
                    className="px-4 py-2.5 hover:bg-saffron-50 cursor-pointer border-b border-gray-100 last:border-0"
                  >
                    <span className="font-medium text-gray-800">{family.name}</span>
                    {family.mobile && (
                      <span className="text-gray-400 text-sm ml-2">{family.mobile}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
            <input
              type="tel"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              placeholder="+61 412 345 678"
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-saffron-500 focus:border-saffron-500 outline-none transition ${
                errors.mobile ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
          </div>

          {/* Adults and Children Count */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Adults <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={formData.adults_count}
                onChange={(e) =>
                  setFormData({ ...formData, adults_count: parseInt(e.target.value) || 0 })
                }
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-saffron-500 focus:border-saffron-500 outline-none transition ${
                  errors.adults_count ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {errors.adults_count && (
                <p className="text-red-500 text-xs mt-1">{errors.adults_count}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Children
              </label>
              <input
                type="number"
                min="0"
                value={formData.children_count}
                onChange={(e) =>
                  setFormData({ ...formData, children_count: parseInt(e.target.value) || 0 })
                }
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-saffron-500 focus:border-saffron-500 outline-none transition ${
                  errors.children_count ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {errors.children_count && (
                <p className="text-red-500 text-xs mt-1">{errors.children_count}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-saffron-600 hover:bg-saffron-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Attendance'}
          </button>
        </form>
      </div>

      {/* Radha Krishna Image */}
      <div className="hidden lg:block">
        <img
          src="/RadhaMadhava_Mayapur_TV_2.JPG"
          alt="Radha Madhava Mayapur"
          className="w-full h-auto max-h-[calc(100vh-12rem)] object-cover rounded-xl shadow-lg"
        />
      </div>
      </div>
    </div>
  );
}

export default AttendancePage;
