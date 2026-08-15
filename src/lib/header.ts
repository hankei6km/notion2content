import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints.d.ts'
import type { HeaderItem, HeaderItemValue } from './types.ts'

export class HeaderToItems {
  constructor() {}
  protected async id(v: PageObjectResponse['id']): Promise<HeaderItemValue> {
    return v
  }
  protected async createdTime(
    v: PageObjectResponse['created_time']
  ): Promise<HeaderItemValue> {
    return v
  }
  protected async lastEditedTime(
    v: PageObjectResponse['last_edited_time']
  ): Promise<HeaderItemValue> {
    return v
  }
  // 現状、query で in_trash を指定することはできないように思える。
  protected async inTrash(
    v: PageObjectResponse['in_trash']
  ): Promise<HeaderItemValue> {
    return v
  }
  protected async isArchived(
    v: PageObjectResponse['is_archived']
  ): Promise<HeaderItemValue> {
    return v
  }
  protected async isLocked(
    v: PageObjectResponse['is_locked']
  ): Promise<HeaderItemValue> {
    return v
  }
  protected async url(v: PageObjectResponse['url']): Promise<HeaderItemValue> {
    return v
  }
  protected async publicUrl(
    v: PageObjectResponse['public_url']
  ): Promise<HeaderItemValue> {
    return v
  }
  protected async icon(
    v: PageObjectResponse['icon']
  ): Promise<HeaderItemValue> {
    if (v !== null) {
      // type によっては構造を持った型になる。url などの文字列だけ取り出す方向も検討か？
      // (cover と異なり色情報などもあるので厳しいか)
      // または、item 名としては icon と emoji のように分けるべきかもしれない。
      if (v.type === 'icon') {
        return v.icon
      } else if (v.type === 'emoji') {
        return v.emoji
      } else if (v.type === 'file') {
        return v.file.url
      } else if (v.type === 'external') {
        return v.external.url
      } else if (v.type === 'custom_emoji') {
        return v.custom_emoji.url
      }
    }
    return ''
  }
  protected async cover(
    v: PageObjectResponse['cover']
  ): Promise<HeaderItemValue> {
    if (v !== null) {
      if (v.type === 'external') {
        return v.external.url
      }
      if (v.type === 'file') {
        return v.file.url
      }
    }
    return ''
  }
  protected async createdBy(
    v: PageObjectResponse['created_by']
  ): Promise<HeaderItemValue> {
    return v.id
  }
  protected async lastEditedBy(
    v: PageObjectResponse['last_edited_by']
  ): Promise<HeaderItemValue> {
    return v.id
  }
  public async toItems(page: PageObjectResponse): Promise<HeaderItem> {
    let ret: HeaderItem = {
      id: await this.id(page.id),
      created_time: await this.createdTime(page.created_time),
      last_edited_time: await this.lastEditedTime(page.last_edited_time),
      in_trash: await this.inTrash(page.in_trash),
      is_archived: await this.isArchived(page.is_archived),
      is_locked: await this.isLocked(page.is_locked),
      url: await this.url(page.url),
      public_url: await this.publicUrl(page.public_url),
      icon: await this.icon(page.icon),
      cover: await this.cover(page.cover),
      created_by: await this.createdBy(page.created_by),
      last_edited_by: await this.lastEditedBy(page.last_edited_by)
    }

    return ret
  }
}
