import { useEffect, useState } from 'react'

interface CountryInfo {
  country: string
  countryCode: string
  flag: string
  loading: boolean
  error: string | null
}

/**
 * Hook ดึงข้อมูลประเทศของผู้เล่น
 * ใช้ Free API: ipapi.co (ไม่ต้องซื้อ API Key)
 */
export function usePlayerCountry(): CountryInfo {
  const [country, setCountry] = useState('')
  const [countryCode, setCountryCode] = useState('')
  const [flag, setFlag] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const getCountry = async () => {
      try {
        setLoading(true)

        // ✅ ใช้ ipapi.co แทน country.is
        const response = await fetch('https://ipapi.co/json/')
        if (!response.ok) {
          throw new Error('ไม่สามารถดึงข้อมูลประเทศได้')
        }

        const data = await response.json()

        if (!data.country_name || !data.country_code) {
          throw new Error('ข้อมูลประเทศไม่สมบูรณ์')
        }

        setCountry(data.country_name)
        setCountryCode(data.country_code)
        setFlag(getFlagEmoji(data.country_code))
        setError(null)
      } catch (err) {
        console.error('❌ Error getting country:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setCountry('Unknown')
        setCountryCode('XX')
      } finally {
        setLoading(false)
      }
    }

    getCountry()
  }, [])

  return { country, countryCode, flag, loading, error }
}

/**
 * แปลง Country Code → Emoji ธงชาติ
 * เช่น "TH" → "🇹🇭"
 */
function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🏳️'
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}
