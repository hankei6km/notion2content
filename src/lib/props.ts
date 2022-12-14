import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import { PropsItem, PropsItemValue } from './types'

type ValueOfProperty<T> = Extract<
  PageObjectResponse['properties'][string],
  { type?: T }
>

export class PropsToItems {
  constructor() {}
  protected async numberValue(
    v: ValueOfProperty<'number'>
  ): Promise<PropsItemValue> {
    // TODO: null を 0 へ変換は妥当か？
    return typeof v.number === 'number' ? v.number : 0
  }
  protected async selectValue(
    v: ValueOfProperty<'select'>
  ): Promise<PropsItemValue> {
    return v.select?.name || ''
  }
  protected async multiSelectValue(
    v: ValueOfProperty<'multi_select'>
  ): Promise<PropsItemValue> {
    return v.multi_select.map((v) => v.name)
  }
  protected async richTitleValue(
    v: ValueOfProperty<'title'>
  ): Promise<PropsItemValue> {
    return v.title.reduce((prev, v) => `${prev}${v.plain_text}`, '')
  }
  protected async richTextValue(
    v: ValueOfProperty<'rich_text'>
  ): Promise<PropsItemValue> {
    return v.rich_text.reduce((prev, v) => `${prev}${v.plain_text}`, '')
  }
  protected async relationValue(
    v: ValueOfProperty<'relation'>
  ): Promise<PropsItemValue> {
    return v.relation.map((v) => v.id)
  }
  public async toItems(
    props: PageObjectResponse['properties']
  ): Promise<PropsItem> {
    let ret: PropsItem = {}
    if (typeof props === 'object') {
      const propsEntries = Object.entries(props)

      for (const [k, v] of propsEntries) {
        switch (v.type) {
          case 'number':
            ret[k] = await this.numberValue(v)
            break
          case 'select':
            ret[k] = await this.selectValue(v)
            break
          case 'multi_select':
            ret[k] = await this.multiSelectValue(v)
            break
          case 'rich_text':
            ret[k] = await this.richTextValue(v)
            break
          case 'title':
            ret[k] = await this.richTitleValue(v)
            break
          case 'relation':
            ret[k] = await this.relationValue(v)
            break
        }
      }
    }

    return ret
  }
}
