import React from 'react'
import { domain, isDev, rootNotionPageId } from 'lib/config'
import { resolveNotionPage } from 'lib/resolve-notion-page'
import omit from 'lodash.omit'
import { ExtendedRecordMap } from 'notion-types'
import { normalizeTitle } from 'notion-utils'
import { NotionPage } from '@/components/NotionPage'
import { NUMBER_OF_POSTS_PER_PAGE } from '../../app/server-constants'
import GoogleAnalytics from '../../components/google-analytics'
import {
  BlogPostLink,
  BlogTagLink,
  NextPageLink,
  NoContents,
  PostDate,
  PostExcerpt,
  PostTags,
  PostTitle,
  ReadMoreLink,
} from '../../components/blog-parts'
import styles from '../../styles/blog.module.css'
import {
  getPosts,
  getFirstPost,
  getRankedPosts,
  getAllTags,
} from '../../lib/notion/client'

const tagsPropertyNameLowerCase = 'tags'

export const getStaticProps = async (context) => {
  const rawTagName = (context.params.tagName as string) || ''

  try {
    const props = await resolveNotionPage(domain, rootNotionPageId)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let propertyToFilterName: string = null

    if ((props as any).recordMap) {
      const recordMap = (props as any).recordMap as ExtendedRecordMap
      const collection = Object.values(recordMap.collection)[0]?.value

      if (collection) {
        const galleryView = Object.values(recordMap.collection_view).find(
          (view) => view.value?.type === 'gallery'
        )?.value

        if (galleryView) {
          const galleryBlock = Object.values(recordMap.block).find(
            (block) =>
              block.value?.type === 'collection_view' &&
              block.value.view_ids?.includes(galleryView.id)
          )

          if (galleryBlock?.value) {
            recordMap.block = {
              [galleryBlock.value.id]: galleryBlock,
              ...omit(recordMap.block, [galleryBlock.value.id])
            }

            const propertyToFilter = Object.entries(collection.schema).find(
              (property) =>
                property[1]?.name?.toLowerCase() === tagsPropertyNameLowerCase
            )
            const propertyToFilterId = propertyToFilter?.[0]
            const filteredValue = normalizeTitle(rawTagName)
            propertyToFilterName = propertyToFilter?.[1]?.options.find(
              (option) => normalizeTitle(option.value) === filteredValue
            )?.value

            if (propertyToFilterId && filteredValue) {
              const query =
                recordMap.collection_query[collection.id]?.[galleryView.id]
              const queryResults = query?.collection_group_results ?? query

              if (queryResults) {
                queryResults.blockIds = queryResults.blockIds.filter((id) => {
                  const block = recordMap.block[id]?.value
                  if (!block || !block.properties) {
                    return false
                  }

                  const value = block.properties[propertyToFilterId]?.[0]?.[0]
                  if (!value) {
                    return false
                  }

                  const values = value.split(',')
                  if (
                    !values.find(
                      (value: string) => normalizeTitle(value) === filteredValue
                    )
                  ) {
                    return false
                  }

                  return true
                })
              }
            }
          }
        }
      }
    }

    const [posts, firstPost, rankedPosts, tags] = await Promise.all([
      getPosts(NUMBER_OF_POSTS_PER_PAGE),
      getFirstPost(),
      getRankedPosts(),
      getAllTags(),
    ])

    return {
      props: {
        ...props,
        tagsPage: true,
        posts,
        firstPost,
        rankedPosts,
        tags,
        propertyToFilterName
      },
      revalidate: 43200
    }
  } catch (err) {
    console.error('page error', domain, rawTagName, err)

    // we don't want to publish the error version of this page, so
    // let next.js know explicitly that incremental SSG failed
    throw err
  }
}

export async function getStaticPaths() {
  if (!isDev) {
    const props = await resolveNotionPage(domain, rootNotionPageId)

    if ((props as any).recordMap) {
      const recordMap = (props as any).recordMap as ExtendedRecordMap
      const collection = Object.values(recordMap.collection)[0]?.value

      if (collection) {
        const propertyToFilterSchema = Object.entries(collection.schema).find(
          (property) =>
            property[1]?.name?.toLowerCase() === tagsPropertyNameLowerCase
        )?.[1]

        const paths = propertyToFilterSchema.options
          .map((option) => normalizeTitle(option.value))
          .filter(Boolean)
          .map((slug) => `/tags/${slug}`)

        return {
          paths,
          fallback: true
        }
      }
    }
  }

  return {
    paths: [],
    fallback: true
  }
}

const BlogPageTag = ({ posts, firstPost, rankedPosts, tags }) => {
  return (
    <>
      <GoogleAnalytics pageTitle="Blog" />
      <div className={styles.container}>
        <div className={styles.mainContent}>
          <NoContents contents={posts} />

          {posts.map(post => {
            return (
              <div className={styles.post} key={post.Slug}>
                <PostDate post={post} />
                <PostTags post={post} />
                <PostTitle post={post} />
                <PostExcerpt post={post} />
                <ReadMoreLink post={post} />
              </div>
            )
          })}

          <footer>
            <NextPageLink firstPost={firstPost} posts={posts} />
          </footer>
        </div>

        <div className={styles.subContent}>
          <BlogPostLink heading="Recommended" posts={rankedPosts} />
          <BlogTagLink heading="Categories" tags={tags} />
        </div>
      </div>
    </>
  )
}

export default function NotionTagsPage(props) {
  const { tagsPage, propertyToFilterName, posts, firstPost, rankedPosts, tags } = props

  if (tagsPage) {
    return <BlogPageTag posts={...props} firstPost={firstPost} rankedPosts={rankedPosts} tags={tags} />
  }

  return <NotionPage {...props} />
}
