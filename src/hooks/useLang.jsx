import { createContext, useContext, useState, useEffect } from 'react'
import { t as translate } from '../lib/i18n.js'

const LangContext = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'fr')

  function changeLang(l) {
    setLang(l)
    localStorage.setItem('lang', l)
  }

  function t(key) {
    return translate(lang, key)
  }

  return (
    <LangContext.Provider value={{ lang, changeLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
