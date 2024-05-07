import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import type {
  PartialUserObjectResponse,
  UserObjectResponse,
  PersonUserObjectResponse
} from '@notionhq/client/build/src/api-endpoints'
import { PropsItem, PropsItemValue } from './types'

function isPersonUserObjectResponse(v: any): v is PersonUserObjectResponse {
  return v.object === 'user' && v.type === 'person'
}

function userToPersonItems(
  user: PartialUserObjectResponse | UserObjectResponse
) {
  if (isPersonUserObjectResponse(user)) {
    return {
      name: user.name !== null ? user.name : '',
      avatar_url: user.avatar_url !== null ? user.avatar_url : '',
      person: {
        email: typeof user.person.email !== 'undefined' ? user.person.email : ''
      }
    }
  }
  return {
    name: '',
    avatar_url: '',
    person: {
      email: ''
    }
  }
}

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
  protected async urlValue(v: ValueOfProperty<'url'>): Promise<PropsItemValue> {
    return v.url !== null ? `${v.url}` : ''
  }
  protected async checkboxValue(
    v: ValueOfProperty<'checkbox'>
  ): Promise<PropsItemValue> {
    return v.checkbox
  }
  protected async createdByValue(
    v: ValueOfProperty<'created_by'>
  ): Promise<PropsItemValue> {
    return userToPersonItems(v.created_by)
  }
  protected async createdTimeValue(
    v: ValueOfProperty<'created_time'>
  ): Promise<PropsItemValue> {
    return v.created_time
  }
  protected async lastEditedByValue(
    v: ValueOfProperty<'last_edited_by'>
  ): Promise<PropsItemValue> {
    return userToPersonItems(v.last_edited_by)
  }
  protected async lastEditedTimeValue(
    v: ValueOfProperty<'last_edited_time'>
  ): Promise<PropsItemValue> {
    return v.last_edited_time
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
  protected async statusValue(
    v: ValueOfProperty<'status'>
  ): Promise<PropsItemValue> {
    return v.status !== null ? v.status.name : ''
  }
  protected async dateValue(
    v: ValueOfProperty<'date'>
  ): Promise<PropsItemValue> {
    return v.date !== null
      ? {
          start: v.date.start,
          end: v.date.end !== null ? v.date.end : '',
          time_zone: v.date.time_zone !== null ? v.date.time_zone : ''
        }
      : {
          start: '',
          end: '',
          time_zone: ''
        }
  }
  protected async emailValue(
    v: ValueOfProperty<'email'>
  ): Promise<PropsItemValue> {
    return v.email !== null ? v.email : ''
  }
  protected async phoneNumberValue(
    v: ValueOfProperty<'phone_number'>
  ): Promise<PropsItemValue> {
    return v.phone_number !== null ? v.phone_number : ''
  }
  protected async richTitleValue(
    v: ValueOfProperty<'title'>
  ): Promise<PropsItemValue> {
    return v.title.reduce((prev, v) => `${prev}${v.plain_text}`, '')
  }
  protected async peopleValue(
    v: ValueOfProperty<'people'>
  ): Promise<PropsItemValue> {
    return v.people.map((v) => userToPersonItems(v))
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
          case 'url':
            ret[k] = await this.urlValue(v)
            break
          case 'checkbox':
            ret[k] = await this.checkboxValue(v)
            break
          case 'created_by':
            ret[k] = await this.createdByValue(v)
            break
          case 'created_time':
            ret[k] = await this.createdTimeValue(v)
            break
          case 'last_edited_by':
            ret[k] = await this.lastEditedByValue(v)
            break
          case 'last_edited_time':
            ret[k] = await this.lastEditedTimeValue(v)
            break
          case 'select':
            ret[k] = await this.selectValue(v)
            break
          case 'multi_select':
            ret[k] = await this.multiSelectValue(v)
            break
          case 'status':
            ret[k] = await this.statusValue(v)
            break
          case 'date':
            ret[k] = await this.dateValue(v)
            break
          case 'email':
            ret[k] = await this.emailValue(v)
            break
          case 'phone_number':
            ret[k] = await this.phoneNumberValue(v)
            break
          case 'people':
            ret[k] = await this.peopleValue(v)
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
