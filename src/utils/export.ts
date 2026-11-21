import { Quiz } from '../types/quiz';

export function exportQuizToCSV(quiz: Quiz) {
  const roundNames = quiz.rounds.map((r) => r.name);
  const headers = ['Rank', 'Team / Participant', 'Institution', 'Department', ...roundNames, 'Total Score'];

  // Calculate ranks
  const sortedTeams = [...quiz.teams].sort((a, b) => (quiz.totalScores[b.id] || 0) - (quiz.totalScores[a.id] || 0));

  const rows = sortedTeams.map((team, idx) => {
    const roundScores = quiz.rounds.map((r) => quiz.roundScores[team.id]?.[r.id] ?? 0);
    const total = quiz.totalScores[team.id] ?? 0;
    return [
      idx + 1,
      `"${team.name}"`,
      `"${team.institution}"`,
      `"${team.department || 'N/A'}"`,
      ...roundScores,
      total,
    ];
  });

  const csvContent = [
    `"MIND EXPEDITION – LIVE QUIZ COMPETITION OFFICIAL RESULTS"`,
    `"Quiz Title: ${quiz.title}"`,
    `"Date: ${quiz.date}"`,
    `"Quizmaster: ${quiz.quizmasterName}"`,
    `"Venue: ${quiz.venue || 'Main Auditorium'}"`,
    '',
    headers.join(','),
    ...rows.map((r) => r.join(',')),
    '',
    `"MANUAL SCORE AUDIT TRAIL"`,
    `"Timestamp","Team","Round","Adjustment","Reason","Authorized By"`,
    ...quiz.manualScoreCorrections.map((c) =>
      `"${c.timestamp}","${c.teamName}","${c.roundName}","${c.delta > 0 ? '+' : ''}${c.delta}","${c.reason}","${c.quizmaster}"`
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Mind_Expedition_${quiz.title.replace(/\s+/g, '_')}_Results.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printOfficialScorecard(quiz: Quiz) {
  const sortedTeams = [...quiz.teams].sort((a, b) => (quiz.totalScores[b.id] || 0) - (quiz.totalScores[a.id] || 0));
  const winner = sortedTeams[0];
  const runnerUp = sortedTeams[1];

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Mind Expedition Official Scorecard - ${quiz.title}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #0f172a; margin: 0; }
          .header { text-align: center; border-bottom: 3px double #0284c7; padding-bottom: 20px; margin-bottom: 25px; }
          .header h1 { margin: 0; font-size: 26px; color: #0369a1; letter-spacing: 1px; }
          .header h2 { margin: 6px 0; font-size: 18px; color: #334155; }
          .tagline { font-style: italic; color: #64748b; font-size: 13px; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 25px; font-size: 14px; background: #f8fafc; padding: 15px; border-radius: 8px; }
          .winner-box { background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 15px; text-align: center; margin-bottom: 25px; }
          .winner-box h3 { margin: 0 0 5px 0; color: #b45309; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
          th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; }
          th { background: #0f172a; color: #ffffff; }
          tr:nth-child(even) { background: #f1f5f9; }
          .total-col { font-weight: bold; background: #e0f2fe; color: #0369a1; text-align: right; }
          .signatures { display: flex; justify-content: space-between; margin-top: 60px; padding-top: 20px; }
          .sig-box { width: 220px; text-align: center; border-top: 1px solid #64748b; padding-top: 6px; font-size: 13px; color: #475569; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>MIND EXPEDITION</h1>
          <div class="tagline">"Explore Knowledge. Challenge Intelligence. Discover Excellence."</div>
          <h2>${quiz.title}</h2>
          ${quiz.subtitle ? `<div style="color: #64748b; font-size: 14px;">${quiz.subtitle}</div>` : ''}
        </div>

        <div class="meta-grid">
          <div><strong>Competition Date:</strong> ${quiz.date}</div>
          <div><strong>Quizmaster:</strong> ${quiz.quizmasterName}</div>
          <div><strong>Venue:</strong> ${quiz.venue || 'Auditorium'}</div>
          <div><strong>Format:</strong> ${quiz.individualOrTeam === 'team' ? 'Team Competition' : 'Individual Competition'}</div>
        </div>

        ${
          winner
            ? `
          <div class="winner-box">
            <h3>★ CHAMPION OF MIND EXPEDITION ★</h3>
            <div style="font-size: 20px; font-weight: bold; color: #0f172a;">${winner.name} (${winner.institution})</div>
            <div style="font-size: 14px; color: #78350f; margin-top: 4px;">Grand Score: <strong>${quiz.totalScores[winner.id] || 0} Marks</strong></div>
            ${runnerUp ? `<div style="font-size: 12px; color: #92400e; margin-top: 6px;">Runner-Up: ${runnerUp.name} (${quiz.totalScores[runnerUp.id] || 0} Marks)</div>` : ''}
          </div>
        `
            : ''
        }

        <h3>OFFICIAL ROUND-WISE SCOREBOARD</h3>
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Team / Participant</th>
              <th>Institution</th>
              ${quiz.rounds.map((r) => `<th>${r.name}</th>`).join('')}
              <th style="text-align: right;">Total Marks</th>
            </tr>
          </thead>
          <tbody>
            ${sortedTeams
              .map(
                (team, idx) => `
              <tr>
                <td style="font-weight: bold; text-align: center;">${idx + 1}</td>
                <td><strong>${team.name}</strong></td>
                <td>${team.institution}</td>
                ${quiz.rounds.map((r) => `<td>${quiz.roundScores[team.id]?.[r.id] ?? 0}</td>`).join('')}
                <td class="total-col">${quiz.totalScores[team.id] ?? 0}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        ${
          quiz.manualScoreCorrections.length > 0
            ? `
          <h3>SCORE AUDIT TRAIL</h3>
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Team</th>
                <th>Round</th>
                <th>Delta</th>
                <th>Reason</th>
                <th>Approved By</th>
              </tr>
            </thead>
            <tbody>
              ${quiz.manualScoreCorrections
                .map(
                  (c) => `
                <tr>
                  <td>${new Date(c.timestamp).toLocaleTimeString()}</td>
                  <td>${c.teamName}</td>
                  <td>${c.roundName}</td>
                  <td><strong>${c.delta > 0 ? '+' : ''}${c.delta}</strong></td>
                  <td>${c.reason}</td>
                  <td>${c.quizmaster}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        `
            : ''
        }

        <div class="signatures">
          <div class="sig-box">Quizmaster Signature</div>
          <div class="sig-box">Head of Department / Convener</div>
          <div class="sig-box">Dean / Principal</div>
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
