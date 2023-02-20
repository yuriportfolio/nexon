import Link from 'next/link'
import * as React from 'react'
import { FaEnvelopeOpenText } from '@react-icons/all-files/fa/FaEnvelopeOpenText'
import { FaGithub } from '@react-icons/all-files/fa/FaGithub'
import { FaLinkedin } from '@react-icons/all-files/fa/FaLinkedin'
import { FaMastodon } from '@react-icons/all-files/fa/FaMastodon'
import { FaRss } from '@react-icons/all-files/fa/FaRss'
import { FaTwitter } from '@react-icons/all-files/fa/FaTwitter'
import { FaYoutube } from '@react-icons/all-files/fa/FaYoutube'
import { FaZhihu } from '@react-icons/all-files/fa/FaZhihu'
import { IoMoonSharp } from '@react-icons/all-files/io5/IoMoonSharp'
import { IoSunnyOutline } from '@react-icons/all-files/io5/IoSunnyOutline'

import * as config from '@/lib/config'
import { useDarkMode } from '@/lib/use-dark-mode'

import styles from './styles.module.css'

const year = new Date().getFullYear()

const Footer = () => {
  const { isDarkMode, onToggleDarkMode } = useDarkMode()

  return (
    <footer className={styles.footer}>
      <div>
        <span>Powered by </span>
        <Link href="https://github.com/otoyo/easy-notion-blog">
          easy-notion-blog
        </Link>
      </div>
      <div className={styles.footer}>
        <div className={styles.settings}>
          <a
            className={styles.toggleDarkMode}
            href="#"
            role="button"
            onClick={onToggleDarkMode}
            title="Toggle dark mode"
          >
            {isDarkMode ? <IoMoonSharp /> : <IoSunnyOutline />}
          </a>
        </div>

        <div className={styles.social}>
          <a
            className={styles.rss}
            href="/feed.xml"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaRss />
          </a>
          {config.twitter && (
            <a
              className={styles.twitter}
              href={`https://twitter.com/${config.twitter}`}
              title={`Twitter @${config.twitter}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaTwitter />
            </a>
          )}

          {config.mastodon && (
            <a
              className={styles.mastodon}
              href={config.mastodon}
              title={`Mastodon ${config.getMastodonHandle()}`}
              rel="me"
            >
              <FaMastodon />
            </a>
          )}

          {config.zhihu && (
            <a
              className={styles.zhihu}
              href={`https://zhihu.com/people/${config.zhihu}`}
              title={`Zhihu @${config.zhihu}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaZhihu />
            </a>
          )}

          {config.github && (
            <a

            className={styles.github}
            href={`https://github.com/${config.github}`}
            title={`GitHub @${config.github}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaGithub />
          </a>
        )}

        <Link href="/about">
          <a className={styles.about}>About</a>
        </Link>
      </div>
    </div>
  </footer>
);}

export default Footer;
