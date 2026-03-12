import gql from 'graphql-tag'

export interface CommuneBasic {
  id: string
  nom: string
  codePostal: string
}

export interface DepartementCommunesData {
  departement: {
    code: string
    nom: string
    communes: CommuneBasic[]
  } | null
}

export const DEPARTEMENT_COMMUNES_QUERY = gql`
  query DepartementCommunes($code: String!) {
    departement(code: $code) {
      code
      nom
      communes {
        id
        nom
        codePostal
      }
    }
  }
`
