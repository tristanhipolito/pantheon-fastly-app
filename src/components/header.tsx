// components/Header.tsx
export default function Header() {
  return (

    <header className="mb-8 flex items-center">
      <div className="relative h-12 w-12 mr-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="50"
          viewBox="0 0 20 20"
          className="beacon-icon"
          aria-hidden="true"
          preserveAspectRatio="xMidYMid meet"
        >
          <path
            fill="#E91A0B"
            d="M11.36 3.285V1.977h.468V1H7.955v.977h.467v1.317A7.925 7.925 0 0 0 9.925 19a7.93 7.93 0 0 0 7.926-7.925 7.92 7.92 0 0 0-6.49-7.79m-1.214 11.859v-.46h-.459v.451a4.074 4.074 0 0 1-3.822-3.848h.459v-.459h-.45a4.077 4.077 0 0 1 3.822-3.822v.45h.459v-.459a4.07 4.07 0 0 1 3.848 3.84h-.459v.458h.459c-.128 2.082-1.784 3.746-3.857 3.848"
          ></path>
          <path
            fill="#E91A0B"
            d="m11.59 9.138-1.41 1.232a.75.75 0 0 0-.781.178.743.743 0 0 0 0 1.062.744.744 0 0 0 1.062 0 .75.75 0 0 0 .178-.782l1.249-1.393z"
          ></path>
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-gray-900">Fastly AGCDN Services</h1>
    </header>
  );
}
