import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="flex flex-col">
      {/* Hero Section - Modern Gradient with Animation */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-700 text-white overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-96 h-96 bg-white/5 rounded-full -top-48 -left-48 animate-pulse"></div>
          <div className="absolute w-96 h-96 bg-white/5 rounded-full -bottom-48 -right-48 animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                <span className="text-sm font-medium">🚀 Next-Gen Custom Manufacturing Platform</span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
                Get Custom Products
                <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                  At The Best Price
                </span>
              </h1>
              
              <p className="text-xl text-primary-100 mb-8 max-w-2xl">
                Post your custom product request once and receive competitive bids from verified suppliers. 
                Anonymous bidding ensures you always get the best deal.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/register?type=customer"
                  className="btn bg-white text-primary-600 hover:bg-gray-100 btn-lg shadow-xl group"
                >
                  <span>Start Your Request</span>
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                
                <Link
                  to="/register?type=supplier"
                  className="btn bg-primary-800/50 hover:bg-primary-800 text-white border-2 border-white/20 btn-lg backdrop-blur-sm group"
                >
                  <span>Join as Supplier</span>
                  <svg className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/10">
                <div>
                  <div className="text-3xl font-bold">10K+</div>
                  <div className="text-sm text-primary-100">Active Users</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">50K+</div>
                  <div className="text-sm text-primary-100">Products Made</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">98%</div>
                  <div className="text-sm text-primary-100">Satisfaction</div>
                </div>
              </div>
            </div>

            {/* Hero Image/Illustration */}
            <div className="hidden lg:block">
              <div className="relative">
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
                  <div className="space-y-4">
                    {/* Mock Request Card */}
                    <div className="bg-white rounded-xl p-6 shadow-lg transform hover:scale-105 transition-transform">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <span className="text-xs font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full">5 Bids</span>
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2">Custom Laptop Stand</h3>
                      <p className="text-sm text-gray-600 mb-4">Aluminum, 100 units needed</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Budget: $2,500</span>
                        <span className="text-xs font-medium text-primary-600">Ends in 2d</span>
                      </div>
                    </div>

                    {/* Mock Bid Cards */}
                    <div className="flex space-x-3">
                      <div className="flex-1 bg-white/90 rounded-lg p-4 shadow">
                        <div className="text-lg font-bold text-gray-900">$1,850</div>
                        <div className="text-xs text-gray-600">Bid #1</div>
                      </div>
                      <div className="flex-1 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-4 shadow-lg">
                        <div className="text-lg font-bold text-white">$1,650</div>
                        <div className="text-xs text-green-100">Best Bid 🏆</div>
                      </div>
                      <div className="flex-1 bg-white/90 rounded-lg p-4 shadow">
                        <div className="text-lg font-bold text-gray-900">$2,100</div>
                        <div className="text-xs text-gray-600">Bid #3</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-16 text-gray-50 fill-current" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
          </svg>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Three simple steps to get your custom products manufactured
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative group">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-primary-200">
                <div className="absolute -top-4 left-8 w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  1
                </div>
                <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center mb-6 mt-4 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Post Your Request</h3>
                <p className="text-gray-600">
                  Describe your custom product needs, upload specifications, and set your budget. Our AI helps categorize your request.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-green-200">
                <div className="absolute -top-4 left-8 w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-700 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  2
                </div>
                <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mb-6 mt-4 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Receive Anonymous Bids</h3>
                <p className="text-gray-600">
                  Verified suppliers submit competitive bids. All bids remain anonymous to ensure fair pricing and prevent bias.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-yellow-200">
                <div className="absolute -top-4 left-8 w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  3
                </div>
                <div className="w-16 h-16 bg-yellow-100 rounded-xl flex items-center justify-center mb-6 mt-4 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Choose & Confirm</h3>
                <p className="text-gray-600">
                  Compare bids, review supplier ratings, and select the best offer. Track your order from production to delivery.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose CustomBid?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to give you the best custom manufacturing experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="flex items-start space-x-4 p-6 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Anonymous Bidding</h3>
                <p className="text-gray-600 text-sm">Suppliers can't see each other's bids, ensuring truly competitive pricing.</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start space-x-4 p-6 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">AI-Powered Matching</h3>
                <p className="text-gray-600 text-sm">Smart categorization connects you with the most relevant suppliers.</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start space-x-4 p-6 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Verified Suppliers</h3>
                <p className="text-gray-600 text-sm">All suppliers are thoroughly vetted and rated by previous customers.</p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex items-start space-x-4 p-6 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Commission-Based</h3>
                <p className="text-gray-600 text-sm">We only succeed when you do. Pay only when your order is complete.</p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="flex items-start space-x-4 p-6 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Real-Time Chat</h3>
                <p className="text-gray-600 text-sm">Communicate directly with suppliers to clarify requirements.</p>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="flex items-start space-x-4 p-6 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Fast Turnaround</h3>
                <p className="text-gray-600 text-sm">Get quotes within 24-48 hours and start production quickly.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-secondary-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of satisfied customers and suppliers on CustomBid today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register?type=customer"
              className="btn bg-white text-primary-600 hover:bg-gray-100 btn-lg shadow-xl"
            >
              Post Your First Request
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              to="/about"
              className="btn bg-transparent hover:bg-white/10 text-white border-2 border-white btn-lg"
            >
              Learn More About Us
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 pt-8 border-t border-white/20">
            <p className="text-sm text-primary-100 mb-4">Trusted by leading companies</p>
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-70">
              <div className="text-2xl font-bold">Company A</div>
              <div className="text-2xl font-bold">Company B</div>
              <div className="text-2xl font-bold">Company C</div>
              <div className="text-2xl font-bold">Company D</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
