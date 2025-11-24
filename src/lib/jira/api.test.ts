import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import {
  buildProjectJQL,
  getAllProjectIssues,
  getOpenIssues,
  getCriticalIssues,
  getIssuesByPriority,
  getIssuesByAssignee,
} from './api'

// Mock axios
vi.mock('axios')
const mockedAxios = vi.mocked(axios)

describe('Jira API Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('buildProjectJQL', () => {
    it('should build basic project JQL with project key', () => {
      const jql = buildProjectJQL('TEST')
      expect(jql).toBe('project = "TEST"')
    })

    it('should handle different project keys', () => {
      expect(buildProjectJQL('PROJ')).toBe('project = "PROJ"')
      expect(buildProjectJQL('ABC')).toBe('project = "ABC"')
    })

    it('should quote project key for JQL safety', () => {
      const jql = buildProjectJQL('MY-PROJECT')
      expect(jql).toContain('"MY-PROJECT"')
    })
  })

  describe('getAllProjectIssues', () => {
    const mockResponse = {
      data: {
        issues: [
          {
            key: 'TEST-1',
            fields: {
              summary: 'Test Issue',
              status: { name: 'Open' },
              priority: { name: 'High' },
            },
          },
        ],
        total: 1,
      },
    }

    it('should fetch all project issues', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockResponse)

      const result = await getAllProjectIssues('TEST')

      expect(result).toEqual(mockResponse.data.issues)
      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/jira/search',
        expect.objectContaining({
          params: expect.objectContaining({
            jql: 'project = "TEST" ORDER BY created DESC',
          }),
        })
      )
    })

    it('should throw error when projectKey is missing', async () => {
      await expect(getAllProjectIssues('')).rejects.toThrow('Project key is required')
    })

    it('should handle API errors gracefully', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'))

      await expect(getAllProjectIssues('TEST')).rejects.toThrow('Network error')
    })

    it('should limit results to 100', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockResponse)

      await getAllProjectIssues('TEST')

      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/jira/search',
        expect.objectContaining({
          params: expect.objectContaining({
            maxResults: 100,
          }),
        })
      )
    })
  })

  describe('getOpenIssues', () => {
    const mockResponse = {
      data: {
        issues: [
          {
            key: 'TEST-1',
            fields: {
              summary: 'Open Issue',
              status: { name: 'Open' },
            },
          },
        ],
      },
    }

    it('should fetch open issues with correct status filter', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockResponse)

      const result = await getOpenIssues('TEST')

      expect(result).toEqual(mockResponse.data.issues)
      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/jira/search',
        expect.objectContaining({
          params: expect.objectContaining({
            jql: expect.stringContaining('status != Done'),
          }),
        })
      )
    })

    it('should throw error when projectKey is missing', async () => {
      await expect(getOpenIssues('')).rejects.toThrow('Project key is required')
    })

    it('should exclude Done, Resolved, and Closed statuses', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockResponse)

      await getOpenIssues('TEST')

      const callArgs = mockedAxios.get.mock.calls[0][1]
      const jql = callArgs?.params?.jql

      expect(jql).toContain('status != Done')
      expect(jql).toContain('status != Resolved')
      expect(jql).toContain('status != Closed')
    })
  })

  describe('getCriticalIssues', () => {
    const mockResponse = {
      data: {
        issues: [
          {
            key: 'TEST-1',
            fields: {
              summary: 'Critical Issue',
              priority: { name: 'Critical' },
            },
          },
        ],
      },
    }

    it('should fetch critical priority issues', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockResponse)

      const result = await getCriticalIssues('TEST')

      expect(result).toEqual(mockResponse.data.issues)
      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/jira/search',
        expect.objectContaining({
          params: expect.objectContaining({
            jql: expect.stringContaining('priority = Critical'),
          }),
        })
      )
    })

    it('should throw error when projectKey is missing', async () => {
      await expect(getCriticalIssues('')).rejects.toThrow('Project key is required')
    })

    it('should exclude Done status', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockResponse)

      await getCriticalIssues('TEST')

      const callArgs = mockedAxios.get.mock.calls[0][1]
      const jql = callArgs?.params?.jql

      expect(jql).toContain('status != Done')
    })
  })

  describe('getIssuesByPriority', () => {
    const mockResponse = {
      data: {
        issues: [
          {
            key: 'TEST-1',
            fields: {
              summary: 'High Priority Issue',
              priority: { name: 'High' },
            },
          },
        ],
      },
    }

    it('should fetch issues by specific priority', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockResponse)

      const result = await getIssuesByPriority('TEST', 'High')

      expect(result).toEqual(mockResponse.data.issues)
      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/jira/search',
        expect.objectContaining({
          params: expect.objectContaining({
            jql: expect.stringContaining('priority = High'),
          }),
        })
      )
    })

    it('should throw error when projectKey is missing', async () => {
      await expect(getIssuesByPriority('', 'High')).rejects.toThrow('Project key is required')
    })

    it('should handle different priority levels', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockResponse)

      await getIssuesByPriority('TEST', 'Low')

      const callArgs = mockedAxios.get.mock.calls[0][1]
      const jql = callArgs?.params?.jql

      expect(jql).toContain('priority = Low')
    })

    it('should handle all priority types', async () => {
      const priorities: Array<'Critical' | 'High' | 'Medium' | 'Low'> = [
        'Critical',
        'High',
        'Medium',
        'Low',
      ]

      for (const priority of priorities) {
        mockedAxios.get.mockResolvedValueOnce(mockResponse)
        await getIssuesByPriority('TEST', priority)

        const callArgs = mockedAxios.get.mock.calls[mockedAxios.get.mock.calls.length - 1][1]
        const jql = callArgs?.params?.jql

        expect(jql).toContain(`priority = ${priority}`)
      }
    })
  })

  describe('getIssuesByAssignee', () => {
    const mockResponse = {
      data: {
        issues: [
          {
            key: 'TEST-1',
            fields: {
              summary: 'Assigned Issue',
              assignee: { accountId: 'john.doe', displayName: 'John Doe' },
            },
          },
        ],
      },
    }

    it('should fetch issues by assignee', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockResponse)

      const result = await getIssuesByAssignee('TEST', 'john.doe')

      expect(result).toEqual(mockResponse.data.issues)
      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/jira/search',
        expect.objectContaining({
          params: expect.objectContaining({
            jql: expect.stringContaining('assignee = "john.doe"'),
          }),
        })
      )
    })

    it('should throw error when projectKey is missing', async () => {
      await expect(getIssuesByAssignee('', 'john.doe')).rejects.toThrow('Project key is required')
    })

    it('should handle unassigned issues query', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockResponse)

      await getIssuesByAssignee('TEST', 'EMPTY')

      const callArgs = mockedAxios.get.mock.calls[0][1]
      const jql = callArgs?.params?.jql

      expect(jql).toContain('assignee = "EMPTY"')
    })

    it('should order by priority and creation date', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockResponse)

      await getIssuesByAssignee('TEST', 'john.doe')

      const callArgs = mockedAxios.get.mock.calls[0][1]
      const jql = callArgs?.params?.jql

      expect(jql).toContain('ORDER BY priority DESC, created ASC')
    })
  })

  describe('Error Handling', () => {
    it('should handle 401 unauthorized errors', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: { status: 401, data: { message: 'Unauthorized' } },
      })

      await expect(getAllProjectIssues('TEST')).rejects.toThrow()
    })

    it('should handle 404 not found errors', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: { status: 404, data: { message: 'Project not found' } },
      })

      await expect(getAllProjectIssues('TEST')).rejects.toThrow()
    })

    it('should handle network timeout errors', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded',
      })

      await expect(getAllProjectIssues('TEST')).rejects.toThrow()
    })

    it('should handle invalid response structure', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: null })

      await expect(getAllProjectIssues('TEST')).rejects.toThrow()
    })
  })

  describe('Request Parameters', () => {
    const mockResponse = {
      data: {
        issues: [],
        total: 0,
      },
    }

    it('should include correct timeout', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockResponse)

      await getAllProjectIssues('TEST')

      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/jira/search',
        expect.objectContaining({
          timeout: 30000,
        })
      )
    })

    it('should request standard Jira fields', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockResponse)

      await getAllProjectIssues('TEST')

      const callArgs = mockedAxios.get.mock.calls[0][1]
      const fields = callArgs?.params?.fields

      expect(fields).toContain('summary')
      expect(fields).toContain('status')
      expect(fields).toContain('priority')
      expect(fields).toContain('assignee')
    })
  })
})
