import { GetServerSideProps } from 'next'
import RSS from 'rss';

import { site, host, name, description, author } from '../lib/config';
import { getSiteMap } from '../lib/get-site-map'
import * as types from 'lib/types'
import { uuidToId } from 'notion-utils';
import { getCanonicalPageUrl } from 'lib/map-page-url'
import { getSocialImageUrl } from 'lib/get-social-image-url'
import { ExtendedRecordMap } from 'lib/types';

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {

  if (req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.write(JSON.stringify({ error: 'method not allowed' }))
    res.end()
    return {
      props: {}
    }
  }

  const siteMap = await getSiteMap()

  // cache for up to 8 hours
  res.setHeader(
    'Cache-Control',
    'public, max-age=28800, stale-while-revalidate=28800'
  )
  res.setHeader('Content-Type', 'text/xml')

  const feed = new RSS({
    title: name,
    site_url: host,
    feed_url: `${host}/feed.xml`,
    description,
    copyright: `${new Date().getFullYear()} ${author}`,
    webMaster: author,
  })

  // For each siteMap, add all the posts to the feed.
  const pageMap = siteMap.canonicalPageMap
  Object.keys(pageMap).map(pageURL => {
    const pageData = pageMap[pageURL] as types.CanonicalPageData
    if (uuidToId(pageData.pageId) === siteMap.site.rootNotionPageId) {
      // Skip the root page.
      return
    }
    const recordMap = siteMap.pageMap[pageData.pageId] as ExtendedRecordMap
    const url = getCanonicalPageUrl(site, recordMap)(pageData.pageId)
    const socialImageUrl = getSocialImageUrl(pageData.pageId)
    feed.item({
      title: pageData.title,
      // description: pageData.description,
      url,
      guid: pageData.pageId,
      date: pageData.createdTime,
      author,
      enclosure: socialImageUrl
        ? {
          url: socialImageUrl,
          type: 'image/jpeg'
        }
        : undefined
    })
  })

  res.write(feed.xml({ indent: true }))

  res.end()
  return {
    props: {}
  }
}

export default () => null
