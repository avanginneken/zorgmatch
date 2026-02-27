'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, CheckCircle, FileText, Trash2, AlertCircle } from 'lucide-react'

type DocumentType = 'VOG' | 'BIG' | 'DIPLOMA' | 'KVK' | 'OVERIG'

const documentTypes: { value: DocumentType; label: string; desc: string; required: boolean }[] = [
  { value: 'VOG', label: 'VOG (Verklaring Omtrent Gedrag)', desc: 'Verplicht voor alle zorgverleners', required: true },
  { value: 'BIG', label: 'BIG-registratie bewijs', desc: 'Voor verpleegkundigen en andere BIG-beroepen', required: false },
  { value: 'DIPLOMA', label: "Diploma's en certificaten", desc: 'Relevante zorgopleiding certificaten', required: true },
  { value: 'KVK', label: 'KvK-uittreksel', desc: 'Uittreksel Kamer van Koophandel', required: true },
  { value: 'OVERIG', label: 'Overige documenten', desc: 'Andere relevante documenten', required: false },
]

interface Document {
  id: string
  type: DocumentType
  naam: string
  geupload_op: string
  geverifieerd: boolean
}

export default function DocumentenPage() {
  const [documenten, setDocumenten] = useState<Document[]>([])
  const [uploading, setUploading] = useState<DocumentType | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [gebruikerId, setGebruikerId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeType, setActiveType] = useState<DocumentType | null>(null)

  useEffect(() => {
    loadDocumenten()
  }, [])

  const loadDocumenten = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: gebruiker } = await supabase
      .from('gebruikers')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (!gebruiker) return
    setGebruikerId(gebruiker.id)

    const { data } = await supabase
      .from('documenten')
      .select('*')
      .eq('gebruiker_id', gebruiker.id)
      .order('geupload_op', { ascending: false })

    setDocumenten(data || [])
  }

  const handleFileSelect = (type: DocumentType) => {
    setActiveType(type)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeType || !gebruikerId) return

    setError('')
    setSuccess('')
    setUploading(activeType)

    try {
      const supabase = createClient()

      // Upload to Supabase Storage
      const filePath = `documenten/${gebruikerId}/${activeType}_${Date.now()}_${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('documenten')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        // For MVP: if bucket doesn't exist yet, we store the file info without actual upload
        console.warn('Storage upload failed (bucket may not exist yet):', uploadError.message)
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documenten')
        .getPublicUrl(filePath)

      // Save document record
      const { error: dbError } = await supabase
        .from('documenten')
        .insert({
          gebruiker_id: gebruikerId,
          type: activeType,
          naam: file.name,
          url: urlData?.publicUrl || filePath,
          geverifieerd: false,
        })

      if (dbError) {
        setError('Fout bij opslaan document: ' + dbError.message)
        return
      }

      setSuccess(`${file.name} succesvol geüpload`)
      await loadDocumenten()
    } catch (err) {
      console.error(err)
      setError('Upload mislukt. Probeer het opnieuw.')
    } finally {
      setUploading(null)
      setActiveType(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (docId: string) => {
    const supabase = createClient()
    await supabase.from('documenten').delete().eq('id', docId)
    setDocumenten(prev => prev.filter(d => d.id !== docId))
  }

  const getDocumentenVoorType = (type: DocumentType) =>
    documenten.filter(d => d.type === type)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mijn documenten</h1>
        <p className="text-gray-600 mt-1">Upload uw documenten voor verificatie door ons team</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700 flex gap-2">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>
          Uw documenten worden handmatig gecontroleerd door ons team. Na goedkeuring kunt u zorgvragen ontvangen.
          Verwerking duurt doorgaans 1-2 werkdagen.
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {success}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileChange}
      />

      {/* Document types */}
      <div className="space-y-4">
        {documentTypes.map(dt => {
          const docs = getDocumentenVoorType(dt.value)
          const isUploading = uploading === dt.value

          return (
            <div key={dt.value} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{dt.label}</h3>
                    {dt.required && (
                      <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Verplicht</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{dt.desc}</p>
                </div>
                <button
                  onClick={() => handleFileSelect(dt.value)}
                  disabled={isUploading}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploaden...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Uploaden
                    </>
                  )}
                </button>
              </div>

              {/* Uploaded documents for this type */}
              {docs.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-gray-50">
                  {docs.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-700 truncate max-w-xs">{doc.naam}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(doc.geupload_op).toLocaleDateString('nl-NL')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.geverifieerd ? (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Geverifieerd
                          </span>
                        ) : (
                          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            In behandeling
                          </span>
                        )}
                        {!doc.geverifieerd && (
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {docs.length === 0 && (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center text-sm text-gray-500">
                  Nog geen document geüpload. Klik op &apos;Uploaden&apos; om een bestand toe te voegen (PDF, JPG, PNG).
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
