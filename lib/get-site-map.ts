import pMemoize from 'p-memoize'
import { getAllPagesInSpace, getPageProperty, getBlockTitle } from 'notion-utils'
import { uuidToId } from 'notion-utils'

import { includeNotionIdInUrls, overrideCreatedTime, overrideLastEditedTime } from './config'
import { notion } from './notion-api'
import { getCanonicalPageId } from './get-canonical-page-id'
import * as config from './config'
import * as types from './types'

const uuid = !!includeNotionIdInUrls

export async function getSiteMap(): Promise<types.SiteMap> {
  const partialSiteMap = await getAllPages(
    config.rootNotionPageId,
    config.rootNotionSpaceId
  )

  return {
    site: config.site,
    ...partialSiteMap
  } as types.SiteMap
}

const getAllPages = pMemoize(getAllPagesImpl, {
  cacheKey: (...args) => JSON.stringify(args)
})

async function getAllPagesImpl(
  rootNotionPageId: string,
  rootNotionSpaceId: string
): Promise<Partial<types.SiteMap>> {
  const getPage = async (pageId: string, ...args) => {
    console.log('\nnotion getPage', uuidToId(pageId))
    return notion.getPage(pageId, ...args)
  }

  const pageMap = await getAllPagesInSpace(
    rootNotionPageId,
    rootNotionSpaceId,
    getPage
  )

  const canonicalPageMap = Object.keys(pageMap).reduce(
    (map, pageId: string) => {
      const recordMap = pageMap[pageId]
      if (!recordMap) {
        throw new Error(`Error loading page "${pageId}"`)
      }

      const canonicalPageId = getCanonicalPageId(pageId, recordMap, {
        uuid
      })

      const block = recordMap.block[pageId]?.value

      // Get Page Title
      const title = getBlockTitle(block, recordMap)

      // Get Last Edited Time
      let lastEditedTime: Date | null = null;
      if (overrideLastEditedTime) {
        let timestamp = NaN;
        try {
          timestamp = getPageProperty(overrideLastEditedTime, block, recordMap);
        } catch (e) {
          console.error(e);
        }
        lastEditedTime = new Date(timestamp);
        // If it's invalidDate, set to null
        if (isNaN(lastEditedTime.getTime())) {
          console.log('overrideLastEditedTime:', overrideLastEditedTime, '. Invalid lastEditedTime: ', lastEditedTime);
          lastEditedTime = null;
        }
      }
      if (!lastEditedTime)
        lastEditedTime = block?.last_edited_time ? new Date(block.last_edited_time) : null

      // Get Created Time
      let createdTime: Date | null = null;
      if (overrideCreatedTime) {
        let timestamp = NaN;
        try {
          timestamp = getPageProperty(overrideCreatedTime, block, recordMap);
        } catch (e) {
          console.error(e);
        }
        createdTime = new Date(timestamp);
        // If it's invalidDate, set to null
        if (isNaN(createdTime.getTime())) {
          console.log('OverrideCreatedTime:', overrideCreatedTime, '. Invalid createdTime: ', createdTime);
          createdTime = null;
        }
      }
      if (!createdTime)
        createdTime = block?.created_time ? new Date(block.created_time) : null

      const canonicalPageData: types.CanonicalPageData = {
        pageId: pageId,
        lastEditedTime,
        createdTime,
        title,
      }

      console.log(pageId, canonicalPageData)

      console.groupEnd()

      if (map[canonicalPageId]) {
        // you can have multiple pages in different collections that have the same id
        // TODO: we may want to error if neither entry is a collection page
        console.warn('error duplicate canonical page id', {
          canonicalPageId,
          pageId,
          existingPageId: map[canonicalPageId]
        })

        return map
      } else {
        return {
          ...map,
          [canonicalPageId]: canonicalPageData
        }
      }
    },
    {}
  )

  return {
    pageMap,
    canonicalPageMap
  }
}
