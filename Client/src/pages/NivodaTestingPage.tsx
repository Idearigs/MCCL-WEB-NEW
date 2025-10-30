import React, { useState } from 'react';
import { Settings, Search, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import API_BASE_URL from '../config/api';

interface PriceResponse {
  success: boolean;
  data?: {
    specs: {
      carat: string;
      clarity: string;
      color: string;
      cut: string;
    };
    prices: {
      min: number;
      avg: number;
      max: number;
    };
    matchingDiamonds: any[];
    count: number;
  };
  message?: string;
  error?: string;
}

interface AvailableOptions {
  carats: string[];
  clarities: string[];
  colours: string[];
  cuts: string[];
  stoneTypes: string[];
}

const NivodaTestingPage: React.FC = () => {
  // Form states
  const [carat, setCarat] = useState('1.0');
  const [clarity, setClarity] = useState('VS1');
  const [color, setColor] = useState('D');
  const [cut, setCut] = useState('EX');
  const [certificate, setCertificate] = useState('');

  // Response states
  const [priceResponse, setPriceResponse] = useState<PriceResponse | null>(null);
  const [availableOptions, setAvailableOptions] = useState<AvailableOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'price' | 'options' | 'search'>('price');

  // Fetch available options
  const handleGetAvailableOptions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/nivoda/available-options`);
      const data = await response.json();

      if (data.success) {
        setAvailableOptions(data.data);
      } else {
        setError(data.message || 'Failed to fetch options');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch price suggestions
  const handleGetPriceSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        carat,
        clarity,
        color,
        cut
      });

      // Add certificate if selected
      if (certificate) {
        params.append('certificate', certificate);
      }

      const response = await fetch(`${API_BASE_URL}/nivoda/diamonds/price-suggestions?${params}`);
      const data = await response.json();

      setPriceResponse(data);

      if (!data.success) {
        setError(data.error || data.message || 'Failed to fetch prices');
      }
    } catch (err: any) {
      setError(err.message);
      setPriceResponse(null);
    } finally {
      setLoading(false);
    }
  };

  // Search diamonds
  const handleSearchDiamonds = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        minCarat: (parseFloat(carat) - 0.25).toString(),
        maxCarat: (parseFloat(carat) + 0.25).toString(),
        clarity,
        color,
        cut,
        limit: '10'
      });

      // Add certificate if selected
      if (certificate) {
        params.append('certificate', certificate);
      }

      const response = await fetch(`${API_BASE_URL}/nivoda/diamonds/search?${params}`);
      const data = await response.json();

      if (data.success) {
        alert(`Found ${data.count} matching diamonds!`);
      } else {
        setError(data.error || 'Failed to search diamonds');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Nivoda API Testing</h1>
          </div>
          <p className="text-gray-600">Test the Nivoda diamond API with different specifications and parameters</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Input Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Test Parameters</h2>

              <div className="space-y-4">
                {/* Carat */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Carat Weight</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    value={carat}
                    onChange={(e) => setCarat(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 1.0"
                  />
                </div>

                {/* Clarity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Clarity</label>
                  <select
                    value={clarity}
                    onChange={(e) => setClarity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="FL">FL - Flawless</option>
                    <option value="IF">IF - Internally Flawless</option>
                    <option value="VVS1">VVS1</option>
                    <option value="VVS2">VVS2</option>
                    <option value="VS1">VS1</option>
                    <option value="VS2">VS2</option>
                    <option value="SI1">SI1</option>
                    <option value="SI2">SI2</option>
                    <option value="SI3">SI3</option>
                    <option value="I1">I1</option>
                    <option value="I2">I2</option>
                    <option value="I3">I3</option>
                  </select>
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                  <select
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="D">D - Colorless</option>
                    <option value="E">E - Colorless</option>
                    <option value="F">F - Colorless</option>
                    <option value="G">G - Near Colorless</option>
                    <option value="H">H - Near Colorless</option>
                    <option value="I">I - Near Colorless</option>
                    <option value="J">J - Near Colorless</option>
                    <option value="K">K</option>
                    <option value="L">L</option>
                    <option value="M">M</option>
                    <option value="N">N</option>
                  </select>
                </div>

                {/* Cut */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cut</label>
                  <select
                    value={cut}
                    onChange={(e) => setCut(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="EX">EX - Excellent</option>
                    <option value="VG">VG - Very Good</option>
                    <option value="G">G - Good</option>
                    <option value="F">F - Fair</option>
                  </select>
                </div>

                {/* Certificate (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Certificate (Optional)</label>
                  <select
                    value={certificate}
                    onChange={(e) => setCertificate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Any/All Certificates</option>
                    <option value="GIA">GIA - Gemological Institute of America</option>
                    <option value="AGS">AGS - American Gem Society</option>
                    <option value="IGI">IGI - International Gemological Institute</option>
                    <option value="EGL">EGL - European Gemological Laboratory</option>
                    <option value="HRD">HRD - Hoge Raad voor Diamanthandel</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Certificate type (if available in inventory)</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 mt-8">
                <button
                  onClick={handleGetPriceSuggestions}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  {loading ? 'Fetching...' : 'Get Price'}
                </button>

                <button
                  onClick={handleSearchDiamonds}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  {loading ? 'Searching...' : 'Search Diamonds'}
                </button>

                <button
                  onClick={handleGetAvailableOptions}
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  {loading ? 'Loading...' : 'Get Available Options'}
                </button>
              </div>

              {/* Current Parameters */}
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Current Request</h3>
                <code className="text-xs text-gray-600 break-all">
                  carat={carat}&clarity={clarity}&color={color}&cut={cut}{certificate ? `&certificate=${certificate}` : ''}
                </code>
              </div>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-2">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900">Error</h3>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Price Response */}
            {priceResponse && !error && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Price Suggestions</h2>
                </div>

                {priceResponse.data && (
                  <div className="space-y-6">
                    {/* Specifications */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Specifications</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-xs text-gray-600">Carat</div>
                          <div className="text-lg font-semibold text-gray-900">{priceResponse.data.specs.carat}</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-xs text-gray-600">Clarity</div>
                          <div className="text-lg font-semibold text-gray-900">{priceResponse.data.specs.clarity}</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-xs text-gray-600">Color</div>
                          <div className="text-lg font-semibold text-gray-900">{priceResponse.data.specs.color}</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-xs text-gray-600">Cut</div>
                          <div className="text-lg font-semibold text-gray-900">{priceResponse.data.specs.cut}</div>
                        </div>
                      </div>
                    </div>

                    {/* Prices */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Prices</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between p-3 bg-blue-50 rounded border border-blue-200">
                          <span className="text-gray-700">Starting from</span>
                          <span className="font-semibold text-blue-900">£{priceResponse.data.prices.min.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-green-50 rounded border border-green-200">
                          <span className="text-gray-700">Average</span>
                          <span className="font-semibold text-green-900">£{priceResponse.data.prices.avg.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-purple-50 rounded border border-purple-200">
                          <span className="text-gray-700">Up to</span>
                          <span className="font-semibold text-purple-900">£{priceResponse.data.prices.max.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Matching Diamonds */}
                    {priceResponse.data.matchingDiamonds && priceResponse.data.matchingDiamonds.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">
                          Matching Diamonds ({priceResponse.data.count})
                        </h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {priceResponse.data.matchingDiamonds.slice(0, 5).map((diamond: any, index: number) => (
                            <div key={index} className="p-3 border border-gray-200 rounded hover:border-blue-300 transition-colors">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <div className="font-semibold text-gray-900">Diamond {index + 1}</div>
                                  <div className="text-xs text-gray-600">ID: {diamond.id}</div>
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold text-blue-600">£{diamond.price.toLocaleString()}</div>
                                </div>
                              </div>

                              {/* Certificate Info */}
                              {diamond.diamond?.certificate && (
                                <div className="mt-2 pt-2 border-t border-gray-100 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Certificate:</span>
                                    <span className="font-medium text-gray-900">{diamond.diamond.certificate.lab}</span>
                                  </div>
                                  {diamond.diamond.certificate.certNumber && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Cert #:</span>
                                      <span className="font-medium text-gray-900">{diamond.diamond.certificate.certNumber}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Raw Response */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Raw API Response</h3>
                      <pre className="p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-x-auto">
                        {JSON.stringify(priceResponse, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Available Options */}
            {availableOptions && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Available Options</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Carats */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Carats</h3>
                    <div className="flex flex-wrap gap-2">
                      {availableOptions.carats.map((c) => (
                        <span key={c} className="px-3 py-1 bg-blue-100 text-blue-900 rounded text-sm font-medium">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Clarities */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Clarities</h3>
                    <div className="flex flex-wrap gap-2">
                      {availableOptions.clarities.map((c) => (
                        <span key={c} className="px-3 py-1 bg-green-100 text-green-900 rounded text-sm font-medium">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Colors */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Colors</h3>
                    <div className="flex flex-wrap gap-2">
                      {availableOptions.colours.map((c) => (
                        <span key={c} className="px-3 py-1 bg-purple-100 text-purple-900 rounded text-sm font-medium">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Cuts */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Cuts</h3>
                    <div className="flex flex-wrap gap-2">
                      {availableOptions.cuts.map((c) => (
                        <span key={c} className="px-3 py-1 bg-orange-100 text-orange-900 rounded text-sm font-medium">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Stone Types */}
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Stone Types</h3>
                    <div className="flex flex-wrap gap-2">
                      {availableOptions.stoneTypes.map((s) => (
                        <span key={s} className="px-3 py-1 bg-red-100 text-red-900 rounded text-sm font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* No Results */}
            {!loading && !priceResponse && !availableOptions && !error && (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <Search className="w-12 h-12 mx-auto opacity-50" />
                </div>
                <p className="text-gray-600">Select parameters and click a button to test the API</p>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <div className="animate-spin mb-4">
                  <Loader className="w-8 h-8 mx-auto text-blue-600" />
                </div>
                <p className="text-gray-600">Loading...</p>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📌 Price Suggestions</h3>
            <p className="text-sm text-blue-800">Get price ranges for diamond specifications. Shows minimum, average, and maximum prices.</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">🔍 Search Diamonds</h3>
            <p className="text-sm text-green-800">Search for actual diamonds from Nivoda inventory matching your specifications.</p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 mb-2">⚙️ Available Options</h3>
            <p className="text-sm text-purple-800">View all valid options for carats, clarity, color, cut, and stone types supported by Nivoda.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NivodaTestingPage;
