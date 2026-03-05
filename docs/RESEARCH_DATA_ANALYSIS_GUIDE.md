# Research Data Analysis Guide

**LearnPlus Learning Platform**  
MSc Dissertation Research Data Analysis Guide  
Last Updated: March 5, 2026

---

## Table of Contents

1. [Introduction](#introduction)
2. [Research Design Overview](#research-design-overview)
3. [Data Structure](#data-structure)
4. [Data Export & Preparation](#data-export--preparation)
5. [Statistical Analysis](#statistical-analysis)
6. [Hypothesis Testing](#hypothesis-testing)
7. [Visualization Techniques](#visualization-techniques)
8. [Example Analysis with R](#example-analysis-with-r)
9. [Example Analysis with Python](#example-analysis-with-python)
10. [Privacy & Ethics](#privacy--ethics)
11. [Reporting Results](#reporting-results)

---

## Introduction

### Purpose

This guide provides comprehensive instructions for analyzing research data collected from the LearnPlus platform. It is designed specifically for MSc dissertation research comparing Control vs AI-Assisted learning modes.

### Research Questions

The platform is designed to answer:

1. **RQ1:** Does AI assistance improve learning outcomes in calculus differentiation?
2. **RQ2:** How does AI assistance affect time-to-completion?
3. **RQ3:** What is the relationship between AI usage patterns and learning success?
4. **RQ4:** How do students perceive AI-assisted learning compared to traditional methods?

### Data Collection Period

- **Start Date:** When first participant begins
- **Duration:** Ongoing until target sample size reached
- **Target Sample:** 100-200 participants (50-100 per group)

---

## Research Design Overview

### Study Design

**Type:** Between-subjects experimental design

**Independent Variable:**
- **Learning Mode** (2 levels)
  - Control: Traditional learning without AI assistance
  - AI-Assisted: Learning with AI tutor support

**Dependent Variables:**
- **Learning Performance**
  - Problem completion rate
  - Answer accuracy
  - Number of attempts per step
  
- **Time Metrics**
  - Total time spent
  - Time per problem
  - Time per step
  
- **AI Interaction (AI group only)**
  - Number of chat messages
  - Types of questions asked
  - Chat message timing
  
- **Subjective Measures**
  - Perceived difficulty (1-5 scale)
  - Learning experience satisfaction (1-5 scale)
  - AI helpfulness (1-5 scale, AI group only)
  - Would recommend (yes/no)

### Participant Assignment

Participants are randomly assigned to conditions via access codes:
- Each access code is pre-assigned to either Control or AI-Assisted mode
- Assignment is balanced (equal numbers in each group)
- Assignment is blind to participants until they enter the platform

---

## Data Structure

### Collections Overview

The platform stores data in Firebase Firestore with the following collections:

1. **users** - Participant demographic and session data
2. **accessCodes** - Access code information
3. **events** - Detailed event logs (interactions, attempts, completions)
4. **surveys** - Post-study survey responses
5. **chatLogs** - AI chat conversations (AI group only)
6. **userProgress** - Step-by-step progress tracking

### Users Collection

```json
{
  "userId": "user-abc123",
  "mode": "ai_assisted",
  "accessCode": "ABCD-1234",
  "createdAt": "2026-03-01T10:00:00.000Z",
  "completedAt": "2026-03-01T11:30:00.000Z",
  "totalTimeSpent": 5400000,
  "completedProblems": ["diff-basics-1", "diff-basics-2"],
  "lastActive": "2026-03-01T11:30:00.000Z"
}
```

**Key Fields:**
- `userId`: Anonymous unique identifier
- `mode`: "control" or "ai_assisted"
- `totalTimeSpent`: Milliseconds spent on platform
- `completedProblems`: Array of completed problem IDs

### Events Collection

```json
{
  "eventId": "event-123",
  "userId": "user-abc123",
  "eventType": "answer_submitted",
  "timestamp": "2026-03-01T10:15:00.000Z",
  "eventData": {
    "problemId": "diff-basics-1",
    "stepNumber": 1,
    "answer": "2x",
    "isCorrect": true,
    "attemptNumber": 2,
    "timeSpent": 45000,
    "hintsUsed": 1
  }
}
```

**Event Types:**
- `problem_viewed`: User started a problem
- `step_viewed`: User viewed a step
- `answer_submitted`: User submitted an answer
- `step_completed`: User completed a step
- `problem_completed`: User completed a problem
- `hint_requested`: User requested a hint
- `chat_message_sent`: User sent chat message (AI group)
- `help_requested`: User requested help

### Surveys Collection

```json
{
  "surveyId": "survey-123",
  "userId": "user-abc123",
  "mode": "ai_assisted",
  "submittedAt": "2026-03-01T11:30:00.000Z",
  "responses": {
    "difficulty": 3,
    "aiHelpfulness": 4,
    "learningExperience": 5,
    "feedback": "The AI tutor was very helpful for understanding the power rule!",
    "wouldRecommend": true,
    "technicalIssues": false
  }
}
```

### Chat Logs Collection (AI Group Only)

```json
{
  "userId": "user-abc123",
  "problemId": "diff-basics-1",
  "timestamp": "2026-03-01T10:20:00.000Z",
  "messages": [
    {
      "role": "user",
      "content": "How do I apply the power rule?",
      "timestamp": "2026-03-01T10:20:00.000Z"
    },
    {
      "role": "assistant",
      "content": "The power rule states...",
      "timestamp": "2026-03-01T10:20:05.000Z",
      "tokensUsed": 75
    }
  ]
}
```

---

## Data Export & Preparation

### Exporting Data

#### Full Export (JSON)

```bash
curl -H "x-admin-key: YOUR_ADMIN_KEY" \
  "https://yourdomain.com/api/admin/export-data?format=json" \
  -o research_data.json
```

#### CSV Export

```bash
curl -H "x-admin-key: YOUR_ADMIN_KEY" \
  "https://yourdomain.com/api/admin/export-data?format=csv" \
  -o research_data.csv
```

### Data Cleaning

#### Python Script for Data Preparation

```python
import pandas as pd
import json
from datetime import datetime

# Load JSON export
with open('research_data.json', 'r') as f:
    data = json.load(f)

# Extract users data
users_df = pd.DataFrame(data['data']['users'])
events_df = pd.DataFrame(data['data']['events'])
surveys_df = pd.DataFrame(data['data']['surveys'])

# Convert timestamps
users_df['createdAt'] = pd.to_datetime(users_df['createdAt'])
users_df['completedAt'] = pd.to_datetime(users_df['completedAt'])
events_df['timestamp'] = pd.to_datetime(events_df['timestamp'])

# Calculate session duration in minutes
users_df['sessionDuration'] = (
    (users_df['completedAt'] - users_df['createdAt']).dt.total_seconds() / 60
)

# Create completion flag
users_df['completed'] = users_df['completedAt'].notna()

# Expand event data
events_expanded = pd.json_normalize(
    events_df.to_dict('records'),
    sep='_'
)

# Save cleaned data
users_df.to_csv('users_clean.csv', index=False)
events_expanded.to_csv('events_clean.csv', index=False)
surveys_df.to_csv('surveys_clean.csv', index=False)

print(f"Users: {len(users_df)}")
print(f"Events: {len(events_expanded)}")
print(f"Surveys: {len(surveys_df)}")
```

#### R Script for Data Preparation

```r
library(jsonlite)
library(dplyr)
library(tidyr)
library(lubridate)

# Load JSON export
data <- fromJSON("research_data.json")

# Extract data frames
users_df <- data$data$users %>% as_tibble()
events_df <- data$data$events %>% as_tibble()
surveys_df <- data$data$surveys %>% as_tibble()

# Convert timestamps
users_df <- users_df %>%
  mutate(
    createdAt = ymd_hms(createdAt),
    completedAt = ymd_hms(completedAt),
    sessionDuration = as.numeric(difftime(completedAt, createdAt, units = "mins")),
    completed = !is.na(completedAt)
  )

# Expand event data
events_expanded <- events_df %>%
  unnest_wider(eventData, names_sep = "_")

# Save cleaned data
write.csv(users_df, "users_clean.csv", row.names = FALSE)
write.csv(events_expanded, "events_clean.csv", row.names = FALSE)
write.csv(surveys_df, "surveys_clean.csv", row.names = FALSE)

cat("Users:", nrow(users_df), "\n")
cat("Events:", nrow(events_expanded), "\n")
cat("Surveys:", nrow(surveys_df), "\n")
```

### Data Quality Checks

#### Check for Missing Data

```python
# Check completion rates
completion_rate = users_df['completed'].mean()
print(f"Completion rate: {completion_rate:.1%}")

# Check for outliers in session duration
print("\nSession Duration Statistics:")
print(users_df['sessionDuration'].describe())

# Check survey response rate
survey_rate = len(surveys_df) / len(users_df)
print(f"\nSurvey response rate: {survey_rate:.1%}")

# Check for data quality issues
print("\nData Quality Checks:")
print(f"Users with negative duration: {(users_df['sessionDuration'] < 0).sum()}")
print(f"Users with unrealistic duration (>180 min): {(users_df['sessionDuration'] > 180).sum()}")
```

#### Exclusion Criteria

Consider excluding participants who:
- Completed in <10 minutes (not engaged)
- Completed in >180 minutes (interrupted session)
- Have incomplete data
- Reported technical issues (check survey responses)

```python
# Apply exclusion criteria
users_filtered = users_df[
    (users_df['sessionDuration'] >= 10) &
    (users_df['sessionDuration'] <= 180) &
    (users_df['completed'] == True)
]

print(f"Original sample: {len(users_df)}")
print(f"Filtered sample: {len(users_filtered)}")
print(f"Excluded: {len(users_df) - len(users_filtered)}")
```

---

## Statistical Analysis

### Descriptive Statistics

#### Sample Characteristics

```python
import pandas as pd
import numpy as np

# Group by mode
grouped = users_filtered.groupby('mode')

# Calculate descriptive statistics
desc_stats = pd.DataFrame({
    'n': grouped.size(),
    'mean_duration': grouped['sessionDuration'].mean(),
    'sd_duration': grouped['sessionDuration'].std(),
    'completion_rate': grouped['completed'].mean()
})

print(desc_stats)
```

**Expected Output:**
```
              n  mean_duration  sd_duration  completion_rate
mode                                                         
ai_assisted  72          54.3         12.5            0.973
control      68          58.2         14.2            0.941
```

#### Performance Metrics

```python
# Calculate answer accuracy by mode
events_correct = events_expanded[events_expanded['eventType'] == 'answer_submitted']

accuracy_by_mode = events_correct.merge(users_df[['userId', 'mode']], on='userId')
accuracy_stats = accuracy_by_mode.groupby('mode')['eventData_isCorrect'].agg([
    'count',
    'mean',
    'std'
])

print("\nAnswer Accuracy by Mode:")
print(accuracy_stats)
```

### Inferential Statistics

#### Independent Samples t-test

**Research Question:** Does AI assistance affect completion time?

**Python (using scipy):**

```python
from scipy import stats

# Separate groups
control_duration = users_filtered[users_filtered['mode'] == 'control']['sessionDuration']
ai_duration = users_filtered[users_filtered['mode'] == 'ai_assisted']['sessionDuration']

# Perform t-test
t_stat, p_value = stats.ttest_ind(control_duration, ai_duration)

# Calculate effect size (Cohen's d)
pooled_std = np.sqrt(((len(control_duration)-1) * control_duration.std()**2 + 
                       (len(ai_duration)-1) * ai_duration.std()**2) / 
                      (len(control_duration) + len(ai_duration) - 2))
cohens_d = (ai_duration.mean() - control_duration.mean()) / pooled_std

print(f"Independent Samples t-test")
print(f"t({len(control_duration) + len(ai_duration) - 2}) = {t_stat:.3f}, p = {p_value:.3f}")
print(f"Cohen's d = {cohens_d:.3f}")
print(f"Control M = {control_duration.mean():.2f}, SD = {control_duration.std():.2f}")
print(f"AI-Assisted M = {ai_duration.mean():.2f}, SD = {ai_duration.std():.2f}")
```

**R (using t.test):**

```r
# Separate groups
control_duration <- users_filtered %>% 
  filter(mode == "control") %>% 
  pull(sessionDuration)

ai_duration <- users_filtered %>% 
  filter(mode == "ai_assisted") %>% 
  pull(sessionDuration)

# Perform t-test
t_result <- t.test(control_duration, ai_duration, var.equal = TRUE)

# Calculate effect size (Cohen's d)
pooled_sd <- sqrt(((length(control_duration)-1) * sd(control_duration)^2 + 
                    (length(ai_duration)-1) * sd(ai_duration)^2) / 
                   (length(control_duration) + length(ai_duration) - 2))
cohens_d <- (mean(ai_duration) - mean(control_duration)) / pooled_sd

print(t_result)
print(paste("Cohen's d =", round(cohens_d, 3)))
```

#### Chi-Square Test

**Research Question:** Does AI assistance affect completion rates?

**Python:**

```python
from scipy.stats import chi2_contingency

# Create contingency table
contingency = pd.crosstab(users_df['mode'], users_df['completed'])

# Perform chi-square test
chi2, p_value, dof, expected = chi2_contingency(contingency)

print(f"Chi-square test")
print(f"χ²({dof}) = {chi2:.3f}, p = {p_value:.3f}")
print("\nContingency Table:")
print(contingency)
```

**R:**

```r
# Create contingency table
contingency <- table(users_df$mode, users_df$completed)

# Perform chi-square test
chi_result <- chisq.test(contingency)

print(chi_result)
print(contingency)
```

#### Mann-Whitney U Test (Non-parametric Alternative)

If data is not normally distributed:

**Python:**

```python
from scipy.stats import mannwhitneyu

# Perform Mann-Whitney U test
u_stat, p_value = mannwhitneyu(control_duration, ai_duration, alternative='two-sided')

print(f"Mann-Whitney U test")
print(f"U = {u_stat:.0f}, p = {p_value:.3f}")
```

**R:**

```r
# Perform Mann-Whitney U test (Wilcoxon rank-sum)
wilcox_result <- wilcox.test(control_duration, ai_duration)
print(wilcox_result)
```

---

## Hypothesis Testing

### Primary Hypotheses

#### H1: Learning Performance

**Hypothesis:** AI-assisted learners will have higher answer accuracy than control learners.

**Analysis:**

```python
# Calculate accuracy per user
user_accuracy = events_expanded[events_expanded['eventType'] == 'answer_submitted'].groupby('userId').agg({
    'eventData_isCorrect': 'mean'
}).reset_index()
user_accuracy.columns = ['userId', 'accuracy']

# Merge with user mode
user_accuracy = user_accuracy.merge(users_filtered[['userId', 'mode']], on='userId')

# t-test
control_acc = user_accuracy[user_accuracy['mode'] == 'control']['accuracy']
ai_acc = user_accuracy[user_accuracy['mode'] == 'ai_assisted']['accuracy']

t_stat, p_value = stats.ttest_ind(control_acc, ai_acc)

print(f"H1: Learning Performance")
print(f"Control accuracy: M = {control_acc.mean():.3f}, SD = {control_acc.std():.3f}")
print(f"AI accuracy: M = {ai_acc.mean():.3f}, SD = {ai_acc.std():.3f}")
print(f"t({len(control_acc) + len(ai_acc) - 2}) = {t_stat:.3f}, p = {p_value:.3f}")

if p_value < 0.05:
    print("Result: Significant difference (H1 supported)")
else:
    print("Result: No significant difference (H1 not supported)")
```

#### H2: Time Efficiency

**Hypothesis:** AI-assisted learners will complete problems faster than control learners.

**Analysis:**

```python
# t-test on session duration
t_stat, p_value = stats.ttest_ind(control_duration, ai_duration)

print(f"\nH2: Time Efficiency")
print(f"Control duration: M = {control_duration.mean():.2f}, SD = {control_duration.std():.2f}")
print(f"AI duration: M = {ai_duration.mean():.2f}, SD = {ai_duration.std():.2f}")
print(f"t({len(control_duration) + len(ai_duration) - 2}) = {t_stat:.3f}, p = {p_value:.3f}")

if p_value < 0.05 and ai_duration.mean() < control_duration.mean():
    print("Result: AI group significantly faster (H2 supported)")
else:
    print("Result: No significant difference or slower (H2 not supported)")
```

#### H3: AI Interaction Patterns

**Hypothesis:** Frequency of AI interaction correlates with learning outcomes.

**Analysis (AI group only):**

```python
# Count chat messages per user
if 'chatLogs' in data['data']:
    chat_counts = pd.DataFrame(data['data']['chatLogs']).groupby('userId').size().reset_index()
    chat_counts.columns = ['userId', 'chatCount']
    
    # Merge with accuracy
    ai_users = user_accuracy[user_accuracy['mode'] == 'ai_assisted'].merge(chat_counts, on='userId', how='left')
    ai_users['chatCount'] = ai_users['chatCount'].fillna(0)
    
    # Correlation analysis
    correlation = ai_users[['chatCount', 'accuracy']].corr().iloc[0, 1]
    
    print(f"\nH3: AI Interaction Patterns")
    print(f"Correlation between chat count and accuracy: r = {correlation:.3f}")
    
    # Regression analysis
    from scipy.stats import linregress
    slope, intercept, r_value, p_value, std_err = linregress(ai_users['chatCount'], ai_users['accuracy'])
    
    print(f"Linear regression: R² = {r_value**2:.3f}, p = {p_value:.3f}")
    
    if p_value < 0.05:
        print("Result: Significant relationship (H3 supported)")
    else:
        print("Result: No significant relationship (H3 not supported)")
```

#### H4: User Satisfaction

**Hypothesis:** AI-assisted learners will report higher satisfaction than control learners.

**Analysis:**

```python
# Merge surveys with user mode
surveys_with_mode = surveys_df.merge(users_df[['userId', 'mode']], on='userId')

# Extract satisfaction scores
control_satisfaction = surveys_with_mode[surveys_with_mode['mode'] == 'control']['responses'].apply(lambda x: x['learningExperience'])
ai_satisfaction = surveys_with_mode[surveys_with_mode['mode'] == 'ai_assisted']['responses'].apply(lambda x: x['learningExperience'])

# Mann-Whitney U (Likert scale is ordinal)
u_stat, p_value = mannwhitneyu(control_satisfaction, ai_satisfaction, alternative='two-sided')

print(f"\nH4: User Satisfaction")
print(f"Control satisfaction: Mdn = {control_satisfaction.median():.1f}, IQR = {control_satisfaction.quantile(0.75) - control_satisfaction.quantile(0.25):.1f}")
print(f"AI satisfaction: Mdn = {ai_satisfaction.median():.1f}, IQR = {ai_satisfaction.quantile(0.75) - ai_satisfaction.quantile(0.25):.1f}")
print(f"Mann-Whitney U = {u_stat:.0f}, p = {p_value:.3f}")

if p_value < 0.05 and ai_satisfaction.median() > control_satisfaction.median():
    print("Result: AI group significantly more satisfied (H4 supported)")
else:
    print("Result: No significant difference (H4 not supported)")
```

---

## Visualization Techniques

### Python Visualizations (matplotlib/seaborn)

#### Distribution Comparison

```python
import matplotlib.pyplot as plt
import seaborn as sns

# Set style
sns.set_style("whitegrid")
plt.figure(figsize=(12, 5))

# Session duration distribution
plt.subplot(1, 2, 1)
sns.histplot(data=users_filtered, x='sessionDuration', hue='mode', kde=True, bins=20)
plt.xlabel('Session Duration (minutes)')
plt.ylabel('Frequency')
plt.title('Distribution of Session Duration by Mode')
plt.legend(title='Mode', labels=['AI-Assisted', 'Control'])

# Accuracy distribution
plt.subplot(1, 2, 2)
sns.boxplot(data=user_accuracy, x='mode', y='accuracy')
plt.xlabel('Learning Mode')
plt.ylabel('Answer Accuracy')
plt.title('Answer Accuracy by Learning Mode')
plt.xticks([0, 1], ['AI-Assisted', 'Control'])

plt.tight_layout()
plt.savefig('performance_comparison.png', dpi=300)
plt.show()
```

#### Time Series Analysis

```python
# Problem completion over time
events_completion = events_expanded[events_expanded['eventType'] == 'problem_completed']
events_completion['hour'] = pd.to_datetime(events_completion['timestamp']).dt.hour

plt.figure(figsize=(10, 6))
completion_by_hour = events_completion.groupby(['hour', 'mode']).size().reset_index(name='count')
sns.lineplot(data=completion_by_hour, x='hour', y='count', hue='mode', marker='o')
plt.xlabel('Hour of Day')
plt.ylabel('Problem Completions')
plt.title('Problem Completion Activity by Time of Day')
plt.legend(title='Mode', labels=['AI-Assisted', 'Control'])
plt.savefig('completion_timeline.png', dpi=300)
plt.show()
```

#### AI Interaction Heatmap

```python
# AI chat interaction patterns (AI group only)
if 'chatLogs' in data['data']:
    chat_df = pd.DataFrame(data['data']['chatLogs'])
    chat_df['hour'] = pd.to_datetime(chat_df['timestamp']).dt.hour
    chat_df['problemId'] = chat_df['problemId']
    
    # Create heatmap data
    heatmap_data = chat_df.groupby(['hour', 'problemId']).size().unstack(fill_value=0)
    
    plt.figure(figsize=(10, 6))
    sns.heatmap(heatmap_data, cmap='YlOrRd', annot=True, fmt='d')
    plt.xlabel('Problem ID')
    plt.ylabel('Hour of Day')
    plt.title('AI Chat Interaction Heatmap')
    plt.tight_layout()
    plt.savefig('ai_interaction_heatmap.png', dpi=300)
    plt.show()
```

### R Visualizations (ggplot2)

#### Performance Comparison

```r
library(ggplot2)
library(gridExtra)

# Session duration comparison
p1 <- ggplot(users_filtered, aes(x = sessionDuration, fill = mode)) +
  geom_density(alpha = 0.6) +
  labs(x = "Session Duration (minutes)", y = "Density",
       title = "Distribution of Session Duration by Mode") +
  theme_minimal() +
  scale_fill_manual(values = c("ai_assisted" = "#4CAF50", "control" = "#2196F3"),
                    labels = c("AI-Assisted", "Control"))

# Accuracy boxplot
p2 <- ggplot(user_accuracy, aes(x = mode, y = accuracy, fill = mode)) +
  geom_boxplot() +
  labs(x = "Learning Mode", y = "Answer Accuracy",
       title = "Answer Accuracy by Learning Mode") +
  theme_minimal() +
  scale_fill_manual(values = c("ai_assisted" = "#4CAF50", "control" = "#2196F3"),
                    labels = c("AI-Assisted", "Control")) +
  scale_x_discrete(labels = c("AI-Assisted", "Control"))

# Combine plots
grid.arrange(p1, p2, ncol = 2)
ggsave("performance_comparison.png", width = 12, height = 5, dpi = 300)
```

#### Survey Results Visualization

```r
# Extract survey responses
survey_data <- surveys_with_mode %>%
  mutate(
    difficulty = map_dbl(responses, ~.x$difficulty),
    learningExperience = map_dbl(responses, ~.x$learningExperience),
    wouldRecommend = map_lgl(responses, ~.x$wouldRecommend)
  )

# Likert scale visualization
ggplot(survey_data, aes(x = learningExperience, fill = mode)) +
  geom_bar(position = "dodge") +
  labs(x = "Learning Experience Rating", y = "Count",
       title = "Learning Experience Ratings by Mode") +
  theme_minimal() +
  scale_fill_manual(values = c("ai_assisted" = "#4CAF50", "control" = "#2196F3"),
                    labels = c("AI-Assisted", "Control"))

ggsave("survey_results.png", width = 10, height = 6, dpi = 300)
```

---

## Example Analysis with R

### Complete Analysis Script

```r
# LearnPlus Research Data Analysis
# Complete analysis script in R

# Load libraries
library(jsonlite)
library(dplyr)
library(tidyr)
library(lubridate)
library(ggplot2)
library(effsize)  # For effect size calculations

# 1. Load and prepare data
cat("Loading data...\n")
data <- fromJSON("research_data.json")

users_df <- data$data$users %>% as_tibble()
events_df <- data$data$events %>% as_tibble()
surveys_df <- data$data$surveys %>% as_tibble()

# Convert timestamps and calculate durations
users_df <- users_df %>%
  mutate(
    createdAt = ymd_hms(createdAt),
    completedAt = ymd_hms(completedAt),
    sessionDuration = as.numeric(difftime(completedAt, createdAt, units = "mins")),
    completed = !is.na(completedAt)
  )

# 2. Data quality checks and filtering
cat("\nData quality checks...\n")
cat("Original sample size:", nrow(users_df), "\n")
cat("Completion rate:", mean(users_df$completed), "\n")

# Apply exclusion criteria
users_filtered <- users_df %>%
  filter(
    sessionDuration >= 10,
    sessionDuration <= 180,
    completed == TRUE
  )

cat("Filtered sample size:", nrow(users_filtered), "\n")
cat("Excluded:", nrow(users_df) - nrow(users_filtered), "\n")

# 3. Descriptive statistics
cat("\n=== DESCRIPTIVE STATISTICS ===\n")

desc_stats <- users_filtered %>%
  group_by(mode) %>%
  summarise(
    n = n(),
    mean_duration = mean(sessionDuration),
    sd_duration = sd(sessionDuration),
    median_duration = median(sessionDuration),
    completion_rate = mean(completed)
  )

print(desc_stats)

# 4. Primary analysis: Session duration
cat("\n=== H1: SESSION DURATION ===\n")

# Separate groups
control_duration <- users_filtered %>% 
  filter(mode == "control") %>% 
  pull(sessionDuration)

ai_duration <- users_filtered %>% 
  filter(mode == "ai_assisted") %>% 
  pull(sessionDuration)

# Check normality
shapiro_control <- shapiro.test(control_duration)
shapiro_ai <- shapiro.test(ai_duration)
cat("Shapiro-Wilk normality test (Control): W =", shapiro_control$statistic, ", p =", shapiro_control$p.value, "\n")
cat("Shapiro-Wilk normality test (AI): W =", shapiro_ai$statistic, ", p =", shapiro_ai$p.value, "\n")

# t-test
t_result <- t.test(control_duration, ai_duration, var.equal = TRUE)
print(t_result)

# Effect size (Cohen's d)
cohens_d <- cohen.d(control_duration, ai_duration)
print(cohens_d)

# 5. Calculate accuracy per user
cat("\n=== H2: ANSWER ACCURACY ===\n")

events_expanded <- events_df %>%
  unnest_wider(eventData, names_sep = "_")

user_accuracy <- events_expanded %>%
  filter(eventType == "answer_submitted") %>%
  group_by(userId) %>%
  summarise(accuracy = mean(eventData_isCorrect, na.rm = TRUE)) %>%
  inner_join(users_filtered %>% select(userId, mode), by = "userId")

# t-test on accuracy
control_acc <- user_accuracy %>% filter(mode == "control") %>% pull(accuracy)
ai_acc <- user_accuracy %>% filter(mode == "ai_assisted") %>% pull(accuracy)

t_accuracy <- t.test(control_acc, ai_acc)
print(t_accuracy)

cohens_d_acc <- cohen.d(control_acc, ai_acc)
print(cohens_d_acc)

# 6. Survey analysis
cat("\n=== H3: USER SATISFACTION ===\n")

surveys_with_mode <- surveys_df %>%
  inner_join(users_filtered %>% select(userId, mode), by = "userId")

# Extract satisfaction ratings
survey_ratings <- surveys_with_mode %>%
  mutate(
    difficulty = map_dbl(responses, ~.x$difficulty),
    learningExperience = map_dbl(responses, ~.x$learningExperience),
    wouldRecommend = map_lgl(responses, ~.x$wouldRecommend)
  )

# Mann-Whitney U test (Likert scales are ordinal)
wilcox_satisfaction <- wilcox.test(
  learningExperience ~ mode,
  data = survey_ratings
)
print(wilcox_satisfaction)

# 7. Create visualizations
cat("\nGenerating visualizations...\n")

# Duration comparison
p_duration <- ggplot(users_filtered, aes(x = mode, y = sessionDuration, fill = mode)) +
  geom_boxplot() +
  geom_jitter(width = 0.2, alpha = 0.3) +
  labs(
    x = "Learning Mode",
    y = "Session Duration (minutes)",
    title = "Session Duration by Learning Mode"
  ) +
  theme_minimal() +
  scale_fill_manual(
    values = c("control" = "#2196F3", "ai_assisted" = "#4CAF50"),
    labels = c("Control", "AI-Assisted")
  ) +
  scale_x_discrete(labels = c("Control", "AI-Assisted"))

ggsave("duration_comparison.png", p_duration, width = 8, height = 6, dpi = 300)

# Accuracy comparison
p_accuracy <- ggplot(user_accuracy, aes(x = mode, y = accuracy, fill = mode)) +
  geom_boxplot() +
  geom_jitter(width = 0.2, alpha = 0.3) +
  labs(
    x = "Learning Mode",
    y = "Answer Accuracy",
    title = "Answer Accuracy by Learning Mode"
  ) +
  theme_minimal() +
  scale_fill_manual(
    values = c("control" = "#2196F3", "ai_assisted" = "#4CAF50"),
    labels = c("Control", "AI-Assisted")
  ) +
  scale_x_discrete(labels = c("Control", "AI-Assisted"))

ggsave("accuracy_comparison.png", p_accuracy, width = 8, height = 6, dpi = 300)

# 8. Generate report summary
cat("\n=== ANALYSIS SUMMARY ===\n")
cat("\nSample Size:\n")
cat("  Control:", sum(users_filtered$mode == "control"), "\n")
cat("  AI-Assisted:", sum(users_filtered$mode == "ai_assisted"), "\n")

cat("\nSession Duration:\n")
cat("  Control: M =", mean(control_duration), ", SD =", sd(control_duration), "\n")
cat("  AI-Assisted: M =", mean(ai_duration), ", SD =", sd(ai_duration), "\n")
cat("  t-test: t =", t_result$statistic, ", p =", t_result$p.value, "\n")
cat("  Cohen's d =", cohens_d$estimate, "\n")

cat("\nAnswer Accuracy:\n")
cat("  Control: M =", mean(control_acc), ", SD =", sd(control_acc), "\n")
cat("  AI-Assisted: M =", mean(ai_acc), ", SD =", sd(ai_acc), "\n")
cat("  t-test: t =", t_accuracy$statistic, ", p =", t_accuracy$p.value, "\n")
cat("  Cohen's d =", cohens_d_acc$estimate, "\n")

cat("\nAnalysis complete!\n")
```

---

## Example Analysis with Python

### Complete Analysis Script

```python
"""
LearnPlus Research Data Analysis
Complete analysis script in Python
"""

import pandas as pd
import numpy as np
import json
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
from scipy.stats import mannwhitneyu, chi2_contingency

# Configuration
sns.set_style("whitegrid")
plt.rcParams['figure.dpi'] = 300

# 1. Load and prepare data
print("Loading data...")
with open('research_data.json', 'r') as f:
    data = json.load(f)

users_df = pd.DataFrame(data['data']['users'])
events_df = pd.DataFrame(data['data']['events'])
surveys_df = pd.DataFrame(data['data']['surveys'])

# Convert timestamps
users_df['createdAt'] = pd.to_datetime(users_df['createdAt'])
users_df['completedAt'] = pd.to_datetime(users_df['completedAt'])
users_df['sessionDuration'] = (users_df['completedAt'] - users_df['createdAt']).dt.total_seconds() / 60
users_df['completed'] = users_df['completedAt'].notna()

# 2. Data quality checks
print("\n=== DATA QUALITY CHECKS ===")
print(f"Original sample size: {len(users_df)}")
print(f"Completion rate: {users_df['completed'].mean():.1%}")

# Apply exclusion criteria
users_filtered = users_df[
    (users_df['sessionDuration'] >= 10) &
    (users_df['sessionDuration'] <= 180) &
    (users_df['completed'] == True)
].copy()

print(f"Filtered sample size: {len(users_filtered)}")
print(f"Excluded: {len(users_df) - len(users_filtered)}")

# 3. Descriptive statistics
print("\n=== DESCRIPTIVE STATISTICS ===")
desc_stats = users_filtered.groupby('mode').agg({
    'userId': 'count',
    'sessionDuration': ['mean', 'std', 'median'],
    'completed': 'mean'
}).round(2)
desc_stats.columns = ['n', 'mean_duration', 'sd_duration', 'median_duration', 'completion_rate']
print(desc_stats)

# 4. Primary analysis: Session duration
print("\n=== H1: SESSION DURATION ===")

control_duration = users_filtered[users_filtered['mode'] == 'control']['sessionDuration']
ai_duration = users_filtered[users_filtered['mode'] == 'ai_assisted']['sessionDuration']

# Check normality
_, p_normal_control = stats.shapiro(control_duration)
_, p_normal_ai = stats.shapiro(ai_duration)
print(f"Shapiro-Wilk normality test:")
print(f"  Control: p = {p_normal_control:.4f}")
print(f"  AI-Assisted: p = {p_normal_ai:.4f}")

# t-test
t_stat, p_value = stats.ttest_ind(control_duration, ai_duration)

# Effect size (Cohen's d)
pooled_std = np.sqrt(((len(control_duration)-1) * control_duration.std()**2 + 
                       (len(ai_duration)-1) * ai_duration.std()**2) / 
                      (len(control_duration) + len(ai_duration) - 2))
cohens_d = (ai_duration.mean() - control_duration.mean()) / pooled_std

print(f"\nIndependent samples t-test:")
print(f"  Control: M = {control_duration.mean():.2f}, SD = {control_duration.std():.2f}")
print(f"  AI-Assisted: M = {ai_duration.mean():.2f}, SD = {ai_duration.std():.2f}")
print(f"  t({len(control_duration) + len(ai_duration) - 2}) = {t_stat:.3f}, p = {p_value:.4f}")
print(f"  Cohen's d = {cohens_d:.3f}")

if p_value < 0.05:
    print("  Result: Significant difference")
else:
    print("  Result: No significant difference")

# 5. Answer accuracy analysis
print("\n=== H2: ANSWER ACCURACY ===")

# Expand event data
events_expanded = pd.json_normalize(
    events_df.to_dict('records'),
    sep='_'
)

# Calculate accuracy per user
user_accuracy = events_expanded[events_expanded['eventType'] == 'answer_submitted'].groupby('userId').agg({
    'eventData_isCorrect': 'mean'
}).reset_index()
user_accuracy.columns = ['userId', 'accuracy']
user_accuracy = user_accuracy.merge(users_filtered[['userId', 'mode']], on='userId')

control_acc = user_accuracy[user_accuracy['mode'] == 'control']['accuracy']
ai_acc = user_accuracy[user_accuracy['mode'] == 'ai_assisted']['accuracy']

# t-test
t_stat_acc, p_value_acc = stats.ttest_ind(control_acc, ai_acc)

# Effect size
pooled_std_acc = np.sqrt(((len(control_acc)-1) * control_acc.std()**2 + 
                           (len(ai_acc)-1) * ai_acc.std()**2) / 
                          (len(control_acc) + len(ai_acc) - 2))
cohens_d_acc = (ai_acc.mean() - control_acc.mean()) / pooled_std_acc

print(f"Independent samples t-test:")
print(f"  Control: M = {control_acc.mean():.3f}, SD = {control_acc.std():.3f}")
print(f"  AI-Assisted: M = {ai_acc.mean():.3f}, SD = {ai_acc.std():.3f}")
print(f"  t({len(control_acc) + len(ai_acc) - 2}) = {t_stat_acc:.3f}, p = {p_value_acc:.4f}")
print(f"  Cohen's d = {cohens_d_acc:.3f}")

if p_value_acc < 0.05:
    print("  Result: Significant difference")
else:
    print("  Result: No significant difference")

# 6. Survey analysis
print("\n=== H3: USER SATISFACTION ===")

surveys_with_mode = surveys_df.merge(users_filtered[['userId', 'mode']], on='userId')

# Extract satisfaction ratings
surveys_with_mode['learningExperience'] = surveys_with_mode['responses'].apply(
    lambda x: x['learningExperience']
)

control_satisfaction = surveys_with_mode[surveys_with_mode['mode'] == 'control']['learningExperience']
ai_satisfaction = surveys_with_mode[surveys_with_mode['mode'] == 'ai_assisted']['learningExperience']

# Mann-Whitney U test (Likert scales are ordinal)
u_stat, p_value_satisfaction = mannwhitneyu(control_satisfaction, ai_satisfaction, alternative='two-sided')

print(f"Mann-Whitney U test:")
print(f"  Control: Mdn = {control_satisfaction.median():.1f}, IQR = {control_satisfaction.quantile(0.75) - control_satisfaction.quantile(0.25):.1f}")
print(f"  AI-Assisted: Mdn = {ai_satisfaction.median():.1f}, IQR = {ai_satisfaction.quantile(0.75) - ai_satisfaction.quantile(0.25):.1f}")
print(f"  U = {u_stat:.0f}, p = {p_value_satisfaction:.4f}")

if p_value_satisfaction < 0.05:
    print("  Result: Significant difference")
else:
    print("  Result: No significant difference")

# 7. Create visualizations
print("\nGenerating visualizations...")

fig, axes = plt.subplots(2, 2, figsize=(14, 10))

# Duration comparison
ax1 = axes[0, 0]
sns.boxplot(data=users_filtered, x='mode', y='sessionDuration', ax=ax1)
ax1.set_xlabel('Learning Mode')
ax1.set_ylabel('Session Duration (minutes)')
ax1.set_title('Session Duration by Learning Mode')
ax1.set_xticklabels(['AI-Assisted', 'Control'])

# Duration distribution
ax2 = axes[0, 1]
sns.histplot(data=users_filtered, x='sessionDuration', hue='mode', kde=True, bins=20, ax=ax2)
ax2.set_xlabel('Session Duration (minutes)')
ax2.set_ylabel('Frequency')
ax2.set_title('Distribution of Session Duration')
ax2.legend(title='Mode', labels=['AI-Assisted', 'Control'])

# Accuracy comparison
ax3 = axes[1, 0]
sns.boxplot(data=user_accuracy, x='mode', y='accuracy', ax=ax3)
ax3.set_xlabel('Learning Mode')
ax3.set_ylabel('Answer Accuracy')
ax3.set_title('Answer Accuracy by Learning Mode')
ax3.set_xticklabels(['AI-Assisted', 'Control'])

# Satisfaction comparison
ax4 = axes[1, 1]
satisfaction_counts = surveys_with_mode.groupby(['mode', 'learningExperience']).size().unstack(fill_value=0)
satisfaction_counts.T.plot(kind='bar', ax=ax4)
ax4.set_xlabel('Learning Experience Rating')
ax4.set_ylabel('Count')
ax4.set_title('Learning Experience Ratings by Mode')
ax4.legend(title='Mode', labels=['AI-Assisted', 'Control'])

plt.tight_layout()
plt.savefig('analysis_results.png', dpi=300)
print("Saved: analysis_results.png")

# 8. Generate summary report
print("\n=== ANALYSIS SUMMARY ===")
print(f"\nSample Size:")
print(f"  Control: {sum(users_filtered['mode'] == 'control')}")
print(f"  AI-Assisted: {sum(users_filtered['mode'] == 'ai_assisted')}")

print(f"\nSession Duration:")
print(f"  Control: M = {control_duration.mean():.2f}, SD = {control_duration.std():.2f}")
print(f"  AI-Assisted: M = {ai_duration.mean():.2f}, SD = {ai_duration.std():.2f}")
print(f"  t-test: t = {t_stat:.3f}, p = {p_value:.4f}")
print(f"  Cohen's d = {cohens_d:.3f}")

print(f"\nAnswer Accuracy:")
print(f"  Control: M = {control_acc.mean():.3f}, SD = {control_acc.std():.3f}")
print(f"  AI-Assisted: M = {ai_acc.mean():.3f}, SD = {ai_acc.std():.3f}")
print(f"  t-test: t = {t_stat_acc:.3f}, p = {p_value_acc:.4f}")
print(f"  Cohen's d = {cohens_d_acc:.3f}")

print(f"\nUser Satisfaction:")
print(f"  Control: Mdn = {control_satisfaction.median():.1f}")
print(f"  AI-Assisted: Mdn = {ai_satisfaction.median():.1f}")
print(f"  Mann-Whitney U: U = {u_stat:.0f}, p = {p_value_satisfaction:.4f}")

print("\nAnalysis complete!")
```

---

## Privacy & Ethics

### Data Protection

1. **Anonymization:** All user IDs are randomly generated
2. **No PII:** System does not collect personally identifiable information
3. **Secure Storage:** Data stored in encrypted Firebase database
4. **Access Control:** Only authorized researchers can access data
5. **Data Minimization:** Only collect necessary research data

### Ethical Considerations

1. **Informed Consent:** Participants must consent before participating
2. **Right to Withdraw:** Participants can withdraw at any time
3. **Data Retention:** Follow IRB-approved retention period
4. **Reporting:** Report aggregate data only, never individual data
5. **Transparency:** Disclose AI usage to participants

### IRB Requirements

Ensure your analysis complies with IRB approval:
- Use approved analysis methods
- Report results as specified in protocol
- Maintain data security
- Follow retention and destruction timelines

---

## Reporting Results

### Dissertation Chapter Structure

#### Chapter 4: Results

**4.1 Sample Characteristics**
- Total participants
- Distribution by mode
- Completion rates
- Exclusions and reasons

**4.2 Descriptive Statistics**
- Session duration (M, SD, range)
- Answer accuracy (M, SD, range)
- Survey ratings (Mdn, IQR)

**4.3 Hypothesis Testing**
- H1: Learning Performance
  - Statistical test results
  - Effect sizes
  - Interpretation
- H2: Time Efficiency
  - Statistical test results
  - Effect sizes
  - Interpretation
- H3: AI Interaction Patterns
  - Correlation/regression results
  - Interpretation
- H4: User Satisfaction
  - Statistical test results
  - Qualitative feedback

**4.4 Additional Findings**
- Unexpected patterns
- Subgroup analyses
- Qualitative insights

### Tables Format

**Table 1: Descriptive Statistics**
```
Mode          n    Mean Duration (SD)    Mean Accuracy (SD)
Control       68   58.2 (14.2)          0.742 (0.123)
AI-Assisted   72   54.3 (12.5)          0.789 (0.098)
```

**Table 2: Hypothesis Test Results**
```
Hypothesis    Test            Statistic    p-value    Effect Size
H1           t-test          t=2.45       .015*      d=0.42
H2           t-test          t=-1.89      .061       d=-0.32
H3           Correlation     r=0.34       .003**     -
H4           Mann-Whitney    U=1850       .022*      -

* p < .05, ** p < .01
```

### APA Style Reporting

**Example paragraphs:**

> "An independent samples t-test was conducted to compare session duration between the Control (M = 58.2, SD = 14.2) and AI-Assisted (M = 54.3, SD = 12.5) groups. Results indicated no significant difference, t(138) = 1.89, p = .061, d = 0.32, suggesting that AI assistance did not significantly reduce completion time."

> "Answer accuracy was significantly higher in the AI-Assisted group (M = 0.789, SD = 0.098) compared to the Control group (M = 0.742, SD = 0.123), t(138) = 2.45, p = .015, d = 0.42, representing a small to medium effect size."

---

**Research Data Analysis Guide Version:** 1.0.0  
**Last Updated:** March 5, 2026  
**Platform Version:** 1.0.0
