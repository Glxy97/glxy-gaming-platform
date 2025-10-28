export default function TailwindTestPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div>
              <h1 className="text-2xl font-bold text-center">Tailwind CSS is Working!</h1>
            </div>
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <p className="text-center">
                  <span className="text-green-600 font-bold">Success!</span> Tailwind CSS is properly configured.
                </p>
                <ul className="list-disc space-y-2 pl-6">
                  <li className="flex items-start">
                    <span className="flex items-center h-6">
                      <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>Preflight styles are loaded</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex items-center h-6">
                      <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>Utility classes are available</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex items-center h-6">
                      <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>Custom theme is applied</span>
                  </li>
                </ul>
                <div className="flex justify-center">
                  <button className="px-4 py-2 font-semibold text-sm bg-cyan-500 text-white rounded-full shadow-sm hover:bg-cyan-600">
                    Test Button
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}