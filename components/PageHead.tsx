import Head from 'next/head'
import React from 'react'

import * as types from 'lib/types'
import * as config from 'lib/config'
import { getSocialImageUrl } from 'lib/get-social-image-url'

export const PageHead: React.FC<
  types.PageProps & {
    title?: string
    description?: string
    image?: string
    imageObjectPosition?: string
    author?: string
    authorImage?: string
    detail?: string
    url?: string
  }
> = ({
  site,
  title,
  description,
  image,
  imageObjectPosition,
  author,
  authorImage,
  detail,
  url
}) => {
  title = title ?? site?.name
  description = description ?? site?.description

  const socialImageUrl = getSocialImageUrl({
    title,
    image,
    imageObjectPosition,
    author,
    authorImage,
    detail
  })

  return (
    <Head>
      <meta charSet='utf-8' />
      <meta httpEquiv='Content-Type' content='text/html; charset=utf-8' />
      <meta
        name='viewport'
        content='width=device-width, initial-scale=1, shrink-to-fit=no'
      />

      <link
        href='https://fonts.googleapis.com/css2?family=Fira+Code&family=Noto+Sans+SC:wght@400;700&family=Roboto+Slab:wght@400;700&display=swap'
        rel='stylesheet'
      />

      {site && (
        <>
          <meta property='og:site_name' content={site.name} />
          <meta property='twitter:domain' content={site.domain} />
        </>
      )}

      {config.twitter && (
        <meta name='twitter:creator' content={`@${config.twitter}`} />
      )}

      {description && (
        <>
          <meta name='description' content={description} />
          <meta property='og:description' content={description} />
          <meta name='twitter:description' content={description} />
        </>
      )}

      {socialImageUrl ? (
        <>
          <meta name='twitter:card' content='summary_large_image' />
          <meta name='twitter:image' content={socialImageUrl} />
          <meta property='og:image' content={socialImageUrl} />
        </>
      ) : (
        <meta name='twitter:card' content='summary' />
      )}

      {url && (
        <>
          <link rel='canonical' href={url} />
          <meta property='og:url' content={url} />
          <meta property='twitter:url' content={url} />
        </>
      )}

      <meta property='og:title' content={title} />
      <meta name='twitter:title' content={title} />
      <title>{title}</title>
    </Head>
  )
}
