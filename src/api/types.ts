export interface TrainingFile {
  bytes: number
  created_at: number
  filename: string
  id: string
  object: string
  purpose: string
  status: string
  status_details: any
}

export interface HyperParam {
  batch_size: number
  learning_rate_multiplier: number
  n_epochs: number
  prompt_loss_weight: number
}

export interface CreateModelReq {
  training_file: string
  model: string
  suffix: string
  validation_file: string
  n_epochs: number | null
  batch_size: null | number
  learning_rate_multiplier: null | number
  prompt_loss_weight: null | number
  compute_classification_metrics: boolean
  classification_n_classes: null
  classification_positive_class: null
  classification_betas: null
}

export interface CancelModelReq {
  id: string
}

export interface CancelModelRes {
  id: string
  object: string
  model: string
  created_at: number
  events: any[]
  fine_tuned_model: string | null
  hyperparams: HyperParam
  organization_id: string
  result_files: any[]
  status: string
  validation_files: any[]
  training_files: any[]
  updated_at: number
  error?: Error
}

export interface DeleteModelReq {
  fine_tuned_model: string
}

interface Error {
  code: string
  message: string
  param: string
  type: string
}

export interface DeleteModelRes {
  id: string
  model: string
  deleted: boolean
  error?: Error
}
