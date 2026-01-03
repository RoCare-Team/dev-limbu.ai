// components/ConnectMetaButton.jsx
export default function ConnectMetaButton() {
  const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID
  const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/meta/callback`

  const loginUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${REDIRECT_URI}&scope=email,public_profile,pages_show_list,pages_read_engagement,instagram_basic`

  return (
    <a href={loginUrl}>
      <button className="px-4 py-2 bg-blue-600 text-white rounded">
        Connect Facebook / Instagram
      </button>
    </a>
  )
}
